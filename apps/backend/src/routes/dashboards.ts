import { zValidator } from "@hono/zod-validator";
import {
  CreateDashboard$,
  CreateDashboardWidget$,
  ReorderDashboardWidgets$,
  ReorderDashboards$,
  UpdateDashboard$,
  UpdateDashboardWidget$,
} from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

const dashboardInclude = {
  widgets: { orderBy: { position: "asc" } },
} as const;

async function ownedDashboard(userId: string, dashboardId: string) {
  return prisma.dashboard.findFirst({ where: { id: dashboardId, userId }, select: { id: true } });
}

export const dashboardsRoutes = new Hono()
  .use(isAuthenticated)
  .get("/", async (c) => {
    const user = c.get("user")!;

    const dashboards = await prisma.dashboard.findMany({
      where: { userId: user.id },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: dashboardInclude,
    });

    return c.json(dashboards);
  })
  .post("/", zValidator("json", CreateDashboard$), async (c) => {
    const user = c.get("user")!;
    const { name } = c.req.valid("json");

    const count = await prisma.dashboard.count({ where: { userId: user.id } });
    const dashboard = await prisma.dashboard.create({
      data: { userId: user.id, name, position: count },
      include: dashboardInclude,
    });

    return c.json(dashboard, 201);
  })
  .patch("/order", zValidator("json", ReorderDashboards$), async (c) => {
    const user = c.get("user")!;
    const { orderedIds } = c.req.valid("json");

    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.dashboard.updateMany({ where: { id, userId: user.id }, data: { position } }),
      ),
    );

    return c.body(null, 204);
  })
  .patch("/:id", zValidator("json", UpdateDashboard$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();

    if (!(await ownedDashboard(user.id, id))) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    const dashboard = await prisma.dashboard.update({
      where: { id },
      data: c.req.valid("json"),
      include: dashboardInclude,
    });

    return c.json(dashboard);
  })
  .delete("/:id", async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();

    const deleted = await prisma.dashboard.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    return c.body(null, 204);
  })
  .post("/:id/widgets", zValidator("json", CreateDashboardWidget$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const { title, width, config } = c.req.valid("json");

    if (!(await ownedDashboard(user.id, id))) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    const count = await prisma.dashboardWidget.count({ where: { dashboardId: id } });
    const widget = await prisma.dashboardWidget.create({
      data: {
        dashboardId: id,
        title,
        width,
        // Kept in sync with the discriminant rather than taken from the client,
        // so the column can never disagree with the stored config.
        type: config.type,
        position: count,
        config,
      },
    });

    return c.json(widget, 201);
  })
  .patch("/:id/widgets/order", zValidator("json", ReorderDashboardWidgets$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const { orderedIds } = c.req.valid("json");

    if (!(await ownedDashboard(user.id, id))) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    await prisma.$transaction(
      orderedIds.map((widgetId, position) =>
        prisma.dashboardWidget.updateMany({
          where: { id: widgetId, dashboardId: id },
          data: { position },
        }),
      ),
    );

    return c.body(null, 204);
  })
  .patch("/:id/widgets/:widgetId", zValidator("json", UpdateDashboardWidget$), async (c) => {
    const user = c.get("user")!;
    const { id, widgetId } = c.req.param();
    const { title, width, config } = c.req.valid("json");

    if (!(await ownedDashboard(user.id, id))) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    const existing = await prisma.dashboardWidget.findFirst({
      where: { id: widgetId, dashboardId: id },
      select: { id: true },
    });
    if (!existing) {
      return c.json({ error: "Widget not found" }, 404);
    }

    const widget = await prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(config !== undefined ? { config, type: config.type } : {}),
      },
    });

    return c.json(widget);
  })
  .delete("/:id/widgets/:widgetId", async (c) => {
    const user = c.get("user")!;
    const { id, widgetId } = c.req.param();

    if (!(await ownedDashboard(user.id, id))) {
      return c.json({ error: "Dashboard not found" }, 404);
    }

    const deleted = await prisma.dashboardWidget.deleteMany({
      where: { id: widgetId, dashboardId: id },
    });
    if (deleted.count === 0) {
      return c.json({ error: "Widget not found" }, 404);
    }

    return c.body(null, 204);
  });
