const { UserSummary } = require('../models');
const aiService = require('./aiService');
const logger = require('../utils/logger');

class SummaryService {
    /**
     * Générer un résumé utilisateur basé sur l'historique des conversations
     */
    async generateUserSummary(userId, chats) {
        try {
            // Préparer les données pour l'analyse
            const conversationData = this.prepareConversationData(chats);

            // Générer le résumé en anglais
            const summaryEn = await this.generateSummaryWithAI(conversationData, 'en');

            // Générer le résumé en arabe
            const summaryAr = await this.generateSummaryWithAI(conversationData, 'ar');

            // Extraire les intérêts et sujets
            const interests = this.extractInterests(conversationData);
            const topics = this.extractTopics(conversationData);

            // Calculer les statistiques
            const statistics = this.calculateStatistics(chats);

            // Créer ou mettre à jour le résumé
            const [summary, created] = await UserSummary.findOrCreate({
                where: { userId },
                defaults: {
                    summary: summaryEn,
                    summaryAr,
                    interests,
                    topics,
                    statistics,
                    generatedBy: 'gemini-2.5-flash',
                },
            });

            if (!created) {
                await summary.update({
                    summary: summaryEn,
                    summaryAr,
                    interests,
                    topics,
                    statistics,
                    lastUpdated: new Date(),
                });
            }

            logger.info(`User summary generated for user ${userId}`);

            return summary;
        } catch (error) {
            logger.error('Error generating user summary:', error);
            throw error;
        }
    }

    /**
     * Préparer les données de conversation pour l'analyse
     */
    prepareConversationData(chats) {
        const data = {
            messages: [],
            topics: new Set(),
            messageCount: 0,
            models: new Set(),
        };

        chats.forEach(chat => {
            if (chat.messages && chat.messages.length > 0) {
                chat.messages.forEach(message => {
                    data.messages.push(message.content);
                    data.messageCount++;

                    if (message.model) {
                        data.models.add(message.model);
                    }
                });
            }

            if (chat.tags && chat.tags.length > 0) {
                chat.tags.forEach(tag => data.topics.add(tag));
            }
        });

        return data;
    }

    /**
     * Générer le résumé avec l'IA
     */
    async generateSummaryWithAI(conversationData, language) {
        const prompt = this.createSummaryPrompt(conversationData, language);

        const response = await aiService.generateResponse({
            message: prompt,
            model: 'gemini-2.5-flash',
            language,
            settings: {
                temperature: 0.7,
                maxTokens: 2000,
            },
        });

        return response.content;
    }

    /**
     * Créer le prompt pour générer le résumé
     */
    createSummaryPrompt(data, language) {
        const sampleMessages = data.messages.slice(0, 20).join('\n');

        if (language === 'ar') {
            return `بناءً على محادثات المستخدم التالية، قم بإنشاء ملخص شخصي موجز (2-3 جمل) يصف اهتماماتهم وأسلوب المحادثة والمواضيع الشائعة:
      
      عينة من الرسائل:
      ${sampleMessages}
      
      قم بإنشاء ملخص ودود ومفيد باللغة العربية.`;
        }

        return `Based on the following user conversations, create a concise personal summary (2-3 sentences) describing their interests, conversation style, and common topics:
    
    Sample messages:
    ${sampleMessages}
    
    Create a friendly and helpful summary in English.`;
    }

    /**
     * Extraire les intérêts des conversations
     */
    extractInterests(data) {
        // Analyse simple des mots-clés fréquents
        const wordFrequency = {};
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'they', 'we']);

        data.messages.forEach(message => {
            const words = message.toLowerCase().split(/\W+/);
            words.forEach(word => {
                if (word.length > 3 && !stopWords.has(word)) {
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                }
            });
        });

        // Retourner les 10 mots les plus fréquents
        return Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Extraire les sujets principaux
     */
    extractTopics(data) {
        const topics = Array.from(data.topics);

        // Ajouter des sujets détectés automatiquement
        const detectedTopics = this.detectTopics(data.messages);

        return [...new Set([...topics, ...detectedTopics])].slice(0, 10);
    }

    /**
     * Détecter automatiquement les sujets
     */
    detectTopics(messages) {
        const topicKeywords = {
            'technology': ['code', 'programming', 'software', 'app', 'website', 'computer', 'tech'],
            'business': ['business', 'company', 'market', 'sales', 'revenue', 'startup', 'entrepreneur'],
            'education': ['learn', 'study', 'course', 'university', 'school', 'education', 'teaching'],
            'health': ['health', 'medical', 'doctor', 'medicine', 'fitness', 'wellness', 'disease'],
            'travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination', 'tourism'],
            'food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'cuisine', 'dish'],
            'entertainment': ['movie', 'music', 'game', 'show', 'entertainment', 'film', 'series'],
            'science': ['science', 'research', 'experiment', 'theory', 'physics', 'chemistry', 'biology'],
        };

        const detectedTopics = [];
        const messagesText = messages.join(' ').toLowerCase();

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            const count = keywords.filter(keyword => messagesText.includes(keyword)).length;
            if (count >= 2) {
                detectedTopics.push(topic);
            }
        });

        return detectedTopics;
    }

    /**
     * Calculer les statistiques
     */
    calculateStatistics(chats) {
        let totalMessages = 0;
        let totalLength = 0;
        const modelUsage = {};
        const languageUsage = { en: 0, ar: 0 };

        chats.forEach(chat => {
            totalMessages += chat.messageCount || 0;

            if (chat.messages) {
                chat.messages.forEach(message => {
                    totalLength += message.content.length;

                    if (message.model) {
                        modelUsage[message.model] = (modelUsage[message.model] || 0) + 1;
                    }
                });
            }

            if (chat.language) {
                languageUsage[chat.language] = (languageUsage[chat.language] || 0) + 1;
            }
        });

        const favoriteModel = Object.entries(modelUsage)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        return {
            totalChats: chats.length,
            totalMessages,
            averageMessageLength: totalMessages > 0 ? Math.round(totalLength / totalMessages) : 0,
            favoriteModel,
            languageUsage,
        };
    }
}

module.exports = new SummaryService();