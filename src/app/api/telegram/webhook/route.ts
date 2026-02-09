import { webhookCallback } from 'grammy';
import { bot } from '@/lib/telegram/bot';

export const dynamic = 'force-dynamic';

export const POST = webhookCallback(bot, 'std/http');
