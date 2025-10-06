const { Chat, Message, User, UserSummary, sequelize } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');


const generateAIResponse = async (chatId, userMessageContent, model) => {
    // Récupérer le chat
    const chat = await Chat.findByPk(chatId);

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    // Récupérer l'historique
    const history = await Message.findAll({
        where: { chatId },
        order: [['createdAt', 'ASC']],
        limit: 20,
    });

    // Générer la réponse IA
    const aiResponse = await aiService.generateResponse({
        message: userMessageContent,
        model: model || chat.model,
        history: history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        language: chat.language,
        settings: chat.settings,
    });

    // Créer et retourner le message assistant
    const assistantMessage = await Message.create({
        chatId,
        role: 'assistant',
        content: aiResponse.content,
        model: model || chat.model,
        tokens: aiResponse.tokens || 0,
    });

    return assistantMessage;
};


// Créer ou récupérer un chat
const createOrGetChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.body;
    const userId = req.user.id;

    let chat;

    if (chatId) {
        // Vérifier que le chat appartient à l'utilisateur
        chat = await Chat.findOne({
            where: { id: chatId, userId },
            include: [{
                model: Message,
                as: 'messages',
                order: [['createdAt', 'ASC']],
                limit: 50,
            }],
        });

        if (!chat) {
            throw new AppError('Chat not found', 404);
        }
    } else {

        // Créer un nouveau chat
        chat = await Chat.create({
            userId,
            title: 'New Chat',
            language: req.user.language,
        });
    }

    res.json({
        success: true,
        chat: chat.toJSON(),
    });
});

const sendMessage = asyncHandler(async (req, res, next) => {
    const { message, model = 'gemini-2.5-flash', chatId: providedChatId } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
        throw new AppError('Message cannot be empty', 400);
    }

    // Transaction pour créer le message utilisateur
    const result = await sequelize.transaction(async (t) => {
        let chat;

        if (providedChatId) {
            chat = await Chat.findOne({
                where: { id: providedChatId, userId },
                transaction: t,
            });

            if (!chat) {
                throw new AppError('Chat not found', 404);
            }
        } else {
            // Créer un nouveau chat
            chat = await Chat.create({
                userId,
                title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                language: req.user.language,
                model,
            }, { transaction: t });
        }

        // Créer le message utilisateur
        const userMessage = await Message.create({
            chatId: chat.id,
            userId,
            role: 'user',
            content: message,
        }, { transaction: t });

        return {
            chatId: chat.id,
            userMessage,
            chat,
        };
    });

    // Récupérer l'historique pour le contexte
    const history = await Message.findAll({
        where: { chatId: result.chatId },
        order: [['createdAt', 'ASC']],
        limit: 20,
    });

    // Générer la réponse IA (hors transaction pour éviter de bloquer la DB)
    const aiResponse = await aiService.generateResponse({
        message,
        model,
        history: history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        language: result.chat.language,
    });

    // Créer le message de l'assistant et mettre à jour le chat
    const assistantMessage = await Message.create({
        chatId: result.chatId,
        role: 'assistant',
        content: aiResponse.content,
        model,
        tokens: aiResponse.tokens || 0,
    });

    // Mettre à jour les statistiques du chat
    await Chat.update(
        {
            messageCount: sequelize.literal('messageCount + 2'), // +2 (user + assistant)
            totalTokens: sequelize.literal(`totalTokens + ${aiResponse.tokens || 0}`),
            lastMessageAt: new Date(),
        },
        {
            where: { id: result.chatId },
        }
    );

    // Émettre via WebSocket si disponible
    if (req.io) {
        req.io.to(`chat:${result.chatId}`).emit('new_message', assistantMessage.toJSON());
    }

    // Retourner les deux messages
    res.json({
        success: true,
        chatId: result.chatId,
        userMessage: result.userMessage.toJSON(),
        message: assistantMessage.toJSON(),
    });
});

const toggleArchiveChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    await chat.update({
        isArchived: !chat.isArchived,
    });

    res.json({
        success: true,
        chat: chat.toJSON(),
        message: chat.isArchived ? 'Chat archived' : 'Chat unarchived',
    });
});

const renameChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title || title.trim().length === 0) {
        throw new AppError('Title cannot be empty', 400);
    }

    if (title.length > 255) {
        throw new AppError('Title is too long (max 255 characters)', 400);
    }

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    await chat.update({
        title: title.trim(),
    });

    res.json({
        success: true,
        chat: chat.toJSON(),
    });
});




// Éditer un message

const editMessage = asyncHandler(async (req, res, next) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    console.log('═══════════════════════════════════════');
    console.log('🔧 EDIT MESSAGE - DÉBUT');
    console.log('MessageId à éditer:', messageId);
    console.log('Nouveau contenu:', content);
    console.log('═══════════════════════════════════════');

    let chatId, chatModel;

    await sequelize.transaction(async (t) => {
        const message = await Message.findOne({
            where: { id: messageId, role: 'user' },
            include: [{ model: Chat, as: 'chat', where: { userId } }],
            transaction: t,
        });

        if (!message) {
            throw new AppError('Message not found', 404);
        }

        console.log('✅ Message trouvé:');
        console.log('  - ID:', message.id);
        console.log('  - Content:', message.content);
        console.log('  - createdAt:', message.createdAt);
        console.log('  - chatId:', message.chatId);

        // Lister TOUS les messages du chat AVANT suppression
        const allMessages = await Message.findAll({
            where: { chatId: message.chatId },
            attributes: ['id', 'role', 'content', 'createdAt'],
            order: [['createdAt', 'ASC']],
            transaction: t,
        });

        console.log('\n📋 TOUS LES MESSAGES DU CHAT:');
        allMessages.forEach(msg => {
            console.log(`  ${msg.id} | ${msg.role} | ${msg.createdAt} | ${msg.content.substring(0, 30)}...`);
        });

        // Identifier les messages à supprimer
        const toDelete = await Message.findAll({
            where: {
                chatId: message.chatId,
                createdAt: { [Op.gt]: message.createdAt },
            },
            attributes: ['id', 'role', 'createdAt'],
            transaction: t,
        });

        console.log('\n🗑️ MESSAGES À SUPPRIMER (createdAt > ' + message.createdAt + '):');
        if (toDelete.length === 0) {
            console.log('  ⚠️ AUCUN MESSAGE À SUPPRIMER !');
        } else {
            toDelete.forEach(msg => {
                console.log(`  ID: ${msg.id} | Role: ${msg.role} | CreatedAt: ${msg.createdAt}`);
            });
        }

        // Supprimer
        const deleteCount = await Message.destroy({
            where: {
                chatId: message.chatId,
                createdAt: { [Op.gt]: message.createdAt },
            },
            transaction: t,
        });

        console.log('\n✂️ SUPPRESSION:', deleteCount, 'messages supprimés');

        // Mettre à jour
        await message.update({
            content: content.trim(),
            isEdited: true,
            editedAt: new Date(),
        }, { transaction: t });

        console.log('✅ Message mis à jour');

        chatId = message.chatId;
        chatModel = message.chat.model;
    });

    console.log('\n🤖 Génération de la réponse IA...');
    const assistantMessage = await generateAIResponse(chatId, content, chatModel);

    const editedMessage = await Message.findByPk(messageId);

    console.log('✅ EDIT MESSAGE - FIN');
    console.log('═══════════════════════════════════════\n');

    res.json({
        success: true,
        editedMessage: editedMessage.toJSON(),
        newMessage: assistantMessage.toJSON(),
    });
});



// Récupérer l'historique des chats
const getChatHistory = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { page = 1, limit = 10, archived = false, search } = req.query;

    const where = {
        userId,
        isArchived: archived === 'true',
    };

    if (search) {
        where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { summary: { [Op.like]: `%${search}%` } },
        ];
    }

    const { count, rows: chats } = await Chat.findAndCountAll({
        where,
        order: [
            ['isPinned', 'DESC'],
            ['lastMessageAt', 'DESC'],
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        include: [{
            model: Message,
            as: 'messages',
            attributes: ['id', 'content', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 1,
        }],
    });

    res.json({
        success: true,
        chats: chats.map(chat => chat.toJSON()),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
    });
});

// Récupérer un chat spécifique
const getChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
        include: [{
            model: Message,
            as: 'messages',
            order: [['createdAt', 'ASC']],
        }],
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    res.json({
        success: true,
        chat: chat.toJSON(),
    });
});

// Supprimer un chat
const deleteChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    await chat.destroy();

    res.json({
        success: true,
        message: 'Chat deleted successfully',
    });
});
const feedbackMessage = asyncHandler(async (req, res, next) => {
    const { messageId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.id;

    // Valider le feedback
    if (!['like', 'dislike'].includes(feedback)) {
        throw new AppError('Invalid feedback value', 400);
    }

    // Trouver le message et vérifier les permissions
    const message = await Message.findOne({
        where: {
            id: messageId,
            role: 'assistant' // Seuls les messages assistant peuvent recevoir du feedback
        },
        include: [{
            model: Chat,
            as: 'chat',
            where: { userId },
        }],
    });

    if (!message) {
        throw new AppError('Message not found or not authorized', 404);
    }

    // Toggle feedback: si l'utilisateur clique sur le même feedback, l'annuler
    const newFeedback = message.feedback === feedback ? null : feedback;

    await message.update({
        feedback: newFeedback,
    });

    res.json({
        success: true,
        message: message.toJSON(),
        feedback: newFeedback,
    });
});
// Mettre à jour un chat
const updateChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const { title, isArchived, isPinned, tags } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (tags !== undefined) updates.tags = tags;

    await chat.update(updates);

    res.json({
        success: true,
        chat: chat.toJSON(),
    });
});

// Régénérer une réponse
const regenerateResponse = asyncHandler(async (req, res, next) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Trouver le message et vérifier les permissions
    const message = await Message.findOne({
        where: { id: messageId },
        include: [{
            model: Chat,
            as: 'chat',
            where: { userId },
        }],
    });

    if (!message) {
        throw new AppError('Message not found', 404);
    }

    // Trouver le message utilisateur précédent
    const userMessage = await Message.findOne({
        where: {
            chatId: message.chatId,
            role: 'user',
            createdAt: { [Op.lt]: message.createdAt },
        },
        order: [['createdAt', 'DESC']],
    });

    if (!userMessage) {
        throw new AppError('User message not found', 404);
    }

    // Obtenir l'historique
    const history = await Message.findAll({
        where: {
            chatId: message.chatId,
            createdAt: { [Op.lt]: userMessage.createdAt },
        },
        order: [['createdAt', 'ASC']],
        limit: 20,
    });

    // Régénérer la réponse
    const aiResponse = await aiService.generateResponse({
        message: userMessage.content,
        model: message.model || 'gpt-4',
        history: history.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
        language: message.chat.language,
        settings: message.chat.settings,
    });

    // Mettre à jour le message
    await message.update({
        content: aiResponse.content,
        tokens: aiResponse.tokens || 0,
        isEdited: true,
        editedAt: new Date(),
    });

    // Émettre via WebSocket
    if (req.io) {
        req.io.to(`chat:${message.chatId}`).emit('message_updated', message.toJSON());
    }

    res.json({
        success: true,
        message: message.toJSON(),
    });
});

// Exporter un chat
const exportChat = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    const chat = await Chat.findOne({
        where: { id: chatId, userId },
        include: [{
            model: Message,
            as: 'messages',
            order: [['createdAt', 'ASC']],
        }],
    });

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    let exportData;
    let contentType;
    let filename;

    switch (format) {
        case 'json':
            exportData = JSON.stringify(chat.toJSON(), null, 2);
            contentType = 'application/json';
            filename = `chat-${chatId}.json`;
            break;

        case 'txt':
            exportData = chat.messages.map(msg =>
                `[${msg.role.toUpperCase()}]: ${msg.content}\n`
            ).join('\n');
            contentType = 'text/plain';
            filename = `chat-${chatId}.txt`;
            break;

        case 'md':
            exportData = `# ${chat.title}\n\n` +
                `**Date**: ${chat.createdAt}\n\n` +
                chat.messages.map(msg =>
                    `### ${msg.role === 'user' ? '👤 User' : '🤖 Assistant'}\n\n${msg.content}\n\n---\n`
                ).join('\n');
            contentType = 'text/markdown';
            filename = `chat-${chatId}.md`;
            break;

        default:
            throw new AppError('Invalid export format', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
});

module.exports = {
    createOrGetChat,
    sendMessage,
    getChatHistory,
    getChat,
    deleteChat,
    updateChat,
    regenerateResponse,
    exportChat,
    editMessage,
    renameChat, toggleArchiveChat, feedbackMessage
};