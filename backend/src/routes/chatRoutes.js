const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const chatController = require('../controllers/chatController');
const { validate } = require('../middleware/errorHandler');
const { chatLimiter, aiSummaryLimiter } = require('../middleware/rateLimiter');
const aiService = require('../services/aiService');


// Validation rules
const sendMessageValidation = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message cannot be empty')
        .isLength({ max: 4000 })
        .withMessage('Message is too long'),
    body('model')
        .optional()
        .isIn(['deepseek/deepseek-chat-v3.1:free', 'gemini-2.5-flash', 'gemini-2.5-pro'])
        .withMessage('Invalid model selected'),
    body('chatId')
        .optional()
        .isUUID()
        .withMessage('Invalid chat ID'),
];

const updateChatValidation = [
    param('chatId')
        .isUUID()
        .withMessage('Invalid chat ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),
    body('isArchived')
        .optional()
        .isBoolean()
        .withMessage('isArchived must be a boolean'),
    body('isPinned')
        .optional()
        .isBoolean()
        .withMessage('isPinned must be a boolean'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
];

const getChatHistoryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('archived')
        .optional()
        .isBoolean()
        .withMessage('Archived must be a boolean'),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search query is too long'),
];

const editMessageValidation = [
    param('messageId')
        .isInt()
        .withMessage('Invalid message ID'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Message content cannot be empty')
        .isLength({ max: 4000 })
        .withMessage('Message is too long'),
];

const feedbackValidation = [
    param('messageId')
        .isInt()
        .withMessage('Invalid message ID'),
    body('feedback')
        .isIn(['like', 'dislike'])
        .withMessage('Feedback must be either "like" or "dislike"'),
];

const renameChatValidation = [
    param('chatId')
        .isUUID()
        .withMessage('Invalid chat ID'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty')
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),
];

router.post('/message', sendMessageValidation, validate, chatController.sendMessage);
router.post(
    '/message/:messageId/feedback',
    feedbackValidation,
    validate,
    chatController.feedbackMessage
);


router.patch('/chat/:chatId/archive', param('chatId').isUUID(), validate, chatController.toggleArchiveChat);
router.patch('/chat/:chatId/rename', renameChatValidation, validate, chatController.renameChat);
router.patch('/message/:messageId/edit', editMessageValidation, validate, chatController.editMessage);
router.post('/chat', chatController.createOrGetChat);
router.get('/history', getChatHistoryValidation, validate, chatController.getChatHistory);
router.get('/chat/:chatId', param('chatId').isUUID(), validate, chatController.getChat);
router.patch('/chat/:chatId', updateChatValidation, validate, chatController.updateChat);
router.delete('/chat/:chatId', param('chatId').isUUID(), validate, chatController.deleteChat);
router.post('/message/:messageId/regenerate', param('messageId').isInt(), validate, chatController.regenerateResponse);
router.get('/chat/:chatId/export', param('chatId').isUUID(), validate, chatController.exportChat);

// Route pour obtenir les modèles disponibles


router.get('/models', (req, res) => {
    try {


        const models = aiService.getAvailableModels(); // ou await si asynchrone

        res.json({
            success: true,
            models,
        });
    } catch (err) {
        console.error('❌ Error fetching models:', err);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch models',
            error: err.message, // pour debug
        });
    }
});

// Route de santé des services AI
router.get('/health', async (req, res) => {
    const aiService = require('../services/aiService');
    const health = await aiService.healthCheck();

    res.json({
        success: true,
        services: health,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;