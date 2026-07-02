import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

// AI Assistant conversation persistence (Page 14 of the PRD). Responses are
// simulated the same way the frontend mock does — swap the body of the
// POST /:id/messages handler for a real LLM call to go live.
export const chatsRouter = Router();
chatsRouter.use(requireAuth);

const AI_RESPONSES = [
  "Based on current sensor fusion, activity in the specified sector has remained within expected baselines over the past 24 hours, with one flagged anomaly under monitoring.",
  "Recommend prioritizing reconnaissance assets toward the northern approach — historical patterns show a higher incidence of unregistered contact reports in that corridor during this period.",
  "Squad readiness across active missions is strong. A small number of personnel are flagged for rotation due to extended deployment windows.",
  "Threat correlation suggests recent signal anomalies and drone incursions may be linked. Recommend cross-referencing SIGINT timestamps with the relevant ISR flight log.",
  "Mission timeline analysis indicates one active operation is trending ahead of schedule. Consider reallocating freed logistics capacity elsewhere.",
];

// GET /chats
chatsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json(chats);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({ title: z.string().min(1) });

// POST /chats
chatsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const { title } = createSchema.parse(req.body);
    const chat = await prisma.chat.create({
      data: { userId: req.user!.id, title },
      include: { messages: true },
    });
    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
});

const renameSchema = z.object({ title: z.string().min(1).max(120) });

// PUT /chats/:id — manual rename, so users aren't stuck with the
// auto-generated "first message" title.
chatsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const { title } = renameSchema.parse(req.body);
    const existing = await prisma.chat.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw new ApiError("Conversation not found.", 404);
    const chat = await prisma.chat.update({
      where: { id: req.params.id },
      data: { title },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    res.json(chat);
  } catch (err) {
    next(err);
  }
});

const messageSchema = z.object({ content: z.string().min(1) });

// POST /chats/:id/messages — appends the user message, then simulates and
// appends an assistant reply, returning only the assistant reply (the
// frontend already has the user message optimistically in local state).
chatsRouter.post("/:id/messages", async (req: AuthedRequest, res, next) => {
  try {
    const { content } = messageSchema.parse(req.body);
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    // Ownership check: chats are strictly per-user — one user's conversation
    // history must never be readable or writable by another account, even if
    // they guess/enumerate a chat id.
    if (!chat || chat.userId !== req.user!.id) throw new ApiError("Conversation not found.", 404);

    await prisma.chatMessage.create({ data: { chatId: chat.id, role: "user", content } });

    if (chat.title === "New conversation" || !chat.title) {
      await prisma.chat.update({ where: { id: chat.id }, data: { title: content.slice(0, 40) } });
    }

    const reply = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
      },
    });
    await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });

    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
});

// DELETE /chats/:id
chatsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
    if (!chat || chat.userId !== req.user!.id) throw new ApiError("Conversation not found.", 404);
    await prisma.chat.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
