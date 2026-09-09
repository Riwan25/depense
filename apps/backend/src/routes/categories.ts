import { zValidator } from "@hono/zod-validator";
import { CreateCategory$, UpdateCategory$ } from "@repo/utils";
import { Hono } from "hono";

import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/middlewares/use-auth";

const categoryInclude = {
  group: {
    select: {
      id: true,
      name: true,
      categories: { select: { id: true, description: true, isPositive: true } },
    },
  },
} as const;

export const categoriesRoutes = new Hono()
  .use(isAuthenticated)
  .get("/", async (c) => {
    const user = c.get("user")!;

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { description: "asc" },
      include: categoryInclude,
    });

    return c.json(categories);
  })
  .post("/", zValidator("json", CreateCategory$), async (c) => {
    const user = c.get("user")!;
    const { subCategoryIds, ...data } = c.req.valid("json");

    const category = await prisma.category.create({
      data: { ...data, userId: user.id },
    });

    const validSubCategoryIds = subCategoryIds
      ? (
          await prisma.category.findMany({
            where: { id: { in: subCategoryIds }, userId: user.id, isPositive: category.isPositive },
            select: { id: true },
          })
        ).map((c) => c.id)
      : [];

    if (validSubCategoryIds.length > 0) {
      await prisma.categoryGroup.create({
        data: {
          userId: user.id,
          name: category.description,
          mainCategoryId: category.id,
          categories: { connect: [category.id, ...validSubCategoryIds].map((id) => ({ id })) },
        },
      });
    }

    const created = await prisma.category.findUniqueOrThrow({
      where: { id: category.id },
      include: categoryInclude,
    });

    return c.json(created, 201);
  })
  .patch("/:id", zValidator("json", UpdateCategory$), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.param();
    const { subCategoryIds, ...data } = c.req.valid("json");

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

    if (subCategoryIds !== undefined) {
      const validSubCategoryIds = (
        await prisma.category.findMany({
          where: {
            id: { in: subCategoryIds, not: id },
            userId: user.id,
            isPositive: category.isPositive,
          },
          select: { id: true },
        })
      ).map((c) => c.id);

      const existingGroup = await prisma.categoryGroup.findUnique({
        where: { mainCategoryId: id },
      });

      if (validSubCategoryIds.length > 0) {
        const memberIds = [id, ...validSubCategoryIds];
        if (existingGroup) {
          await prisma.categoryGroup.update({
            where: { id: existingGroup.id },
            data: {
              name: category.description,
              categories: { set: memberIds.map((memberId) => ({ id: memberId })) },
            },
          });
        } else {
          await prisma.categoryGroup.create({
            data: {
              userId: user.id,
              name: category.description,
              mainCategoryId: id,
              categories: { connect: memberIds.map((memberId) => ({ id: memberId })) },
            },
          });
        }
      } else if (existingGroup) {
        await prisma.categoryGroup.delete({ where: { id: existingGroup.id } });
      }
    } else {
      // Keep the group's name (if any) in sync with a rename.
      await prisma.categoryGroup.updateMany({
        where: { mainCategoryId: id },
        data: { name: category.description },
      });
    }

    const updated = await prisma.category.findUniqueOrThrow({
      where: { id },
      include: categoryInclude,
    });

    return c.json(updated);
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
