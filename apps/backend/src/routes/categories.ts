import { CreateCategory$, UpdateCategory$ } from "@repo/utils";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

export const categoriesRoutes = new Hono()
  .use(isAuthenticated)
  .get("/", async (c) => {
    const user = c.get("user")!;

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { description: "asc" },
    });

    return c.json(categories);
  })
  .post("/", zValidator("json", CreateCategory$), async (c) => {
    const user = c.get("user")!;
    const data = c.req.valid("json");

    const category = await prisma.category.create({
      data: { ...data, userId: user.id },
    });

    return c.json(category, 201);
  })
  .patch("/:id", zValidator("json", UpdateCategory$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const data = c.req.valid("json");

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return c.json({ error: "Category not found" }, 404);
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return c.json(category);
  })
  .delete("/:id", async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();

    const existing = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return c.json({ error: "Category not found" }, 404);
    }

    await prisma.category.delete({ where: { id } });

    return c.body(null, 204);
  });
