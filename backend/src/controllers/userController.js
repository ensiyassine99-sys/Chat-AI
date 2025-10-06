// src/controllers/userController.js
const { User, UserSummary, Chat, Message } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const summaryService = require('../services/summaryService');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// Récupérer le profil utilisateur
const getProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  const user = await User.findByPk(userId, {
    include: [{
      model: UserSummary,
      as: 'summary',
    }],
    attributes: { exclude: ['password'] },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    user: user.toJSON(),
  });
});

// Mettre à jour le profil
const updateProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { username, email, language, theme } = req.body;
  
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Vérifier l'unicité du username et email si modifiés
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('Username already taken', 409);
    }
  }
  
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
  }
  
  // Mettre à jour les champs
  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (language) updates.language = language;
  if (theme) updates.theme = theme;
  
  await user.update(updates);
  
  res.json({
    success: true,
    user: user.toJSON(),
    message: req.t('profile.updateSuccess'),
  });
});

// Uploader un avatar
const uploadAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Supprimer l'ancien avatar s'il existe
  if (user.avatar) {
    const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
    try {
      await fs.unlink(oldAvatarPath);
    } catch (error) {
      logger.error('Error deleting old avatar:', error);
    }
  }
  
  // Enregistrer le nouveau chemin d'avatar
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  await user.update({ avatar: avatarPath });
  
  res.json({
    success: true,
    avatar: avatarPath,
    message: 'Avatar uploaded successfully',
  });
});

// Supprimer l'avatar
const deleteAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  if (user.avatar) {
    const avatarPath = path.join(__dirname, '../../', user.avatar);
    try {
      await fs.unlink(avatarPath);
    } catch (error) {
      logger.error('Error deleting avatar:', error);
    }
    
    await user.update({ avatar: null });
  }
  
  res.json({
    success: true,
    message: 'Avatar deleted successfully',
  });
});

// Mettre à jour les préférences
const updatePreferences = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const preferences = req.body;
  
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  await user.update({
    preferences: {
      ...user.preferences,
      ...preferences,
    },
  });
  
  res.json({
    success: true,
    preferences: user.preferences,
    message: 'Preferences updated successfully',
  });
});

// Récupérer le résumé utilisateur
const getUserSummary = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  const summary = await UserSummary.findOne({
    where: { userId },
  });
  
  if (!summary) {
    res.json({
      success: true,
      summary: null,
      message: 'No summary generated yet',
    });
    return;
  }
  
  // Retourner le résumé dans la langue de l'utilisateur
  const summaryContent = req.user.language === 'ar' && summary.summaryAr 
    ? summary.summaryAr 
    : summary.summary;
  
  res.json({
    success: true,
    summary: {
      ...summary.toJSON(),
      content: summaryContent,
    },
  });
});

// Générer un nouveau résumé utilisateur
const generateUserSummary = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Récupérer les dernières conversations
  const recentChats = await Chat.findAll({
    where: { userId },
    include: [{
      model: Message,
      as: 'messages',
      where: { role: 'user' },
      limit: 10,
    }],
    order: [['lastMessageAt', 'DESC']],
    limit: 20,
  });
  
  if (recentChats.length === 0) {
    throw new AppError('Not enough conversation history to generate summary', 400);
  }
  
  // Générer le résumé avec l'IA
  const summary = await summaryService.generateUserSummary(userId, recentChats);
  
  res.json({
    success: true,
    summary: {
      ...summary.toJSON(),
      content: req.user.language === 'ar' && summary.summaryAr 
        ? summary.summaryAr 
        : summary.summary,
    },
    message: 'Summary generated successfully',
  });
});

// Récupérer les statistiques utilisateur
const getUserStatistics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Statistiques des chats
  const chatStats = await Chat.findOne({
    where: { userId },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalChats'],
      [sequelize.fn('SUM', sequelize.col('messageCount')), 'totalMessages'],
      [sequelize.fn('AVG', sequelize.col('messageCount')), 'avgMessagesPerChat'],
      [sequelize.fn('SUM', sequelize.col('totalTokens')), 'totalTokensUsed'],
    ],
    raw: true,
  });
  
  // Modèle le plus utilisé
 const modelUsage = await Message.findAll({
    where: { role: 'assistant' },
    include: [{
      model: Chat,
      as: 'chat',
      where: { userId },
      attributes: [],
    }],
    attributes: [
      [sequelize.col('Message.model'), 'model'],  // ✅ Préciser Message.model
      [sequelize.fn('COUNT', '*'), 'count'],
    ],
    group: ['Message.model'],  // ✅ Préciser Message.model
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 1,
    raw: true,
  });

  
  // Activité par jour de la semaine
  const weekActivity = await Message.findAll({
    include: [{
      model: Chat,
      as: 'chat',
      where: { userId },
      attributes: [],
    }],
    attributes: [
      [sequelize.fn('strftime', '%w', sequelize.col('Message.createdAt')), 'dayOfWeek'],
      [sequelize.fn('COUNT', '*'), 'count'],
    ],
    group: ['dayOfWeek'],
    raw: true,
  });
  
  // Longueur moyenne des messages
  const messageLength = await Message.findOne({
    where: { userId, role: 'user' },
    attributes: [
      [sequelize.fn('AVG', sequelize.fn('LENGTH', sequelize.col('content'))), 'avgLength'],
    ],
    raw: true,
  });
  
  // Tags les plus utilisés
  const topTags = await Chat.findAll({
    where: { 
      userId,
      tags: { [Op.ne]: [] },
    },
    attributes: ['tags'],
    raw: true,
  });
  
  const tagCounts = {};
  topTags.forEach(chat => {
    if (chat.tags && Array.isArray(chat.tags)) {
      chat.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  
  res.json({
    success: true,
    statistics: {
      chats: {
        total: parseInt(chatStats?.totalChats) || 0,
        totalMessages: parseInt(chatStats?.totalMessages) || 0,
        avgMessagesPerChat: parseFloat(chatStats?.avgMessagesPerChat) || 0,
        totalTokensUsed: parseInt(chatStats?.totalTokensUsed) || 0,
      },
      favoriteModel: modelUsage[0]?.model || 'N/A',
      weekActivity: weekActivity.map(day => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(day.dayOfWeek)],
        count: parseInt(day.count),
      })),
      avgMessageLength: Math.round(messageLength?.avgLength || 0),
      topTags: sortedTags,
      memberSince: req.user.createdAt,
      lastActive: req.user.lastLogin,
    },
  });
});

// Supprimer le compte
const deleteAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { password } = req.body;
  
  if (!password) {
    throw new AppError('Password required to delete account', 400);
  }
  
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Vérifier le mot de passe
  const isValid = await user.comparePassword(password);
  
  if (!isValid) {
    throw new AppError('Incorrect password', 401);
  }
  
  // Supprimer toutes les données associées (cascade delete)
  await user.destroy();
  
  logger.info(`User account deleted: ${user.email}`);
  
  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
});

// Exporter les données utilisateur
const exportUserData = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { format = 'json' } = req.body;
  
  // Récupérer toutes les données utilisateur
  const userData = await User.findByPk(userId, {
    include: [
      {
        model: UserSummary,
        as: 'summary',
      },
      {
        model: Chat,
        as: 'chats',
        include: [{
          model: Message,
          as: 'messages',
        }],
      },
    ],
    attributes: { exclude: ['password'] },
  });
  
  if (!userData) {
    throw new AppError('User not found', 404);
  }
  
  let exportData;
  let contentType;
  let filename;
  
  switch (format) {
    case 'json':
      exportData = JSON.stringify(userData.toJSON(), null, 2);
      contentType = 'application/json';
      filename = `user-data-${userId}.json`;
      break;
      
    case 'csv':
      // Créer un CSV simple avec les informations principales
      const csvData = [
        ['Field', 'Value'],
        ['Username', userData.username],
        ['Email', userData.email],
        ['Language', userData.language],
        ['Theme', userData.theme],
        ['Total Chats', userData.chats.length],
        ['Member Since', userData.createdAt],
      ];
      
      exportData = csvData.map(row => row.join(',')).join('\n');
      contentType = 'text/csv';
      filename = `user-data-${userId}.csv`;
      break;
      
    default:
      throw new AppError('Invalid export format', 400);
  }
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updatePreferences,
  getUserSummary,
  generateUserSummary,
  getUserStatistics,
  deleteAccount,
  exportUserData,
};