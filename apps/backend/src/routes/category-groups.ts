import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

export const categoryGroupsRoutes = new Hono().use(isAuthenticated).get("/", async (c) => {
  const user = c.get("user")!;

  const groups = await prisma.categoryGroup.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: { categories: { select: { id: true, description: true, isPositive: true } } },
  });

  return c.json(groups);
});
