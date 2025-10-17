// src/services/aiService.js
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HfInference } = require('@huggingface/inference');
const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AIService {
    constructor() {
        this.initializeProviders();
    }

    initializeProviders() {


        // Google Gemini
        if (process.env.GOOGLE_AI_API_KEY) {
            this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
            logger.info('Google Gemini provider initialized');
        }

        // Hugging Face
        if (process.env.HUGGINGFACE_API_KEY) {
            this.huggingface = new HfInference(process.env.HUGGINGFACE_API_KEY);
            logger.info('Hugging Face provider initialized');
        }

        // DeepSeek ou autres modèles open source
        this.deepseekEndpoint = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
    }

    /**
     * Générer une réponse en utilisant le modèle spécifié
     */
    async generateResponse({ message, model, history = [], language = 'en', settings = {} }) {
        try {
            let response;

            // Préparer le contexte avec l'historique
            const messages = this.prepareMessages(message, history, language);

            // Sélectionner le provider basé sur le modèle
            switch (this.getProvider(model)) {

                case 'gemini':
                    response = await this.generateGemini(messages, model, settings);
                    break;


                case 'deepseek':
                    response = await this.generateDeepSeek(messages, model, settings);
                    break;

                default:

                    response = await this.generateFallback(messages, settings);
            }

            // Traduire si nécessaire
            if (language === 'ar' && !this.isArabicSupported(model)) {
                response.content = await this.translateToArabic(response.content);
            }

            return response;
        } catch (error) {
            logger.error('AI generation error:', error);
            throw new AppError('Failed to generate AI response', 500);
        }
    }

    /**
     * Préparer les messages avec le contexte système
     */
    prepareMessages(message, history, language) {
        const systemPrompt = this.getSystemPrompt(language);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
        ];

        return messages;
    }

    /**
     * Obtenir le prompt système selon la langue
     */
    getSystemPrompt(language) {
        const prompts = {
            en: `You are a helpful AI assistant. Provide clear, accurate, and helpful responses. 
           Be conversational but professional. If you're unsure about something, acknowledge it.
           Format your responses using markdown when appropriate for better readability.`,

            ar: `أنت مساعد ذكاء اصطناعي مفيد. قدم إجابات واضحة ودقيقة ومفيدة.
           كن محادثًا ولكن احترافيًا. إذا لم تكن متأكدًا من شيء ما، اعترف بذلك.
           قم بتنسيق إجاباتك باستخدام markdown عند الاقتضاء لتحسين القراءة.`,
        };

        return prompts[language] || prompts.en;
    }



    /**
     * Générer avec Google Gemini
     */
    async generateGemini(messages, model, settings) {


        if (!this.gemini) {
            throw new Error('Gemini provider not configured');
        }

        const genModel = this.gemini.getGenerativeModel({
            model: model || "gemini-2.5-flash",
        });

        // Convertir le format des messages pour Gemini
        const prompt = messages
            .filter(msg => msg.role !== 'system')
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');

        const result = await genModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: settings.temperature || 0.7,
                maxOutputTokens: settings.maxTokens || 2000,
                topP: settings.topP || 1,
            },
        });

        const response = await result.response;

        return {
            content: response.text(),
            tokens: response.usageMetadata?.totalTokenCount || 0,
            model: model,
        };
    }



    /**
     * Générer avec DeepSeek
     */
    async generateDeepSeek(messages, model, settings) {
        // Vérification de la clé pour DeepSeek
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error('DEEPSEEK_API_KEY manquante');
        }

        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages,
                    temperature: settings?.temperature ?? 0.7,
                    max_tokens: settings?.maxTokens ?? 2000,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    },
                }
            );

            return {
                content: response.data.choices[0].message.content,
                tokens: response.data.usage?.total_tokens || 0,
                model: response.data.model,
            };
        } catch (error) {
            console.error('DeepSeek API error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            throw new Error(`DeepSeek API failed: ${error.message}`);
        }
    }


    /**
     * Fallback vers un modèle local ou gratuit
     */
    async generateFallback(messages, settings) {
        // Utiliser un modèle Hugging Face gratuit comme fallback
        try {
            const prompt = messages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');

            // Appel à un modèle gratuit via l'API Hugging Face
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
                {
                    inputs: prompt,
                    parameters: {
                        max_length: settings.maxTokens || 500,
                        temperature: settings.temperature || 0.7,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                content: response.data[0]?.generated_text || 'I apologize, but I am unable to generate a response at this time.',
                tokens: 0,
                model: 'dialogpt-medium',
            };
        } catch (error) {
            logger.error('Fallback model error:', error);

            // Réponse par défaut en cas d'échec total
            return {
                content: 'I apologize, but I am currently experiencing technical difficulties. Please try again later.',
                tokens: 0,
                model: 'fallback',
            };
        }
    }

    /**
     * Traduire en arabe si nécessaire
     */
    async translateToArabic(text) {
        try {
            // Utiliser un service de traduction gratuit ou l'API Google Translate
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-ar',
                { inputs: text },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    },
                }
            );

            return response.data[0]?.translation_text || text;
        } catch (error) {
            logger.error('Translation error:', error);
            return text; // Retourner le texte original en cas d'erreur
        }
    }

    /**
     * Déterminer le provider basé sur le nom du modèle
     */
    getProvider(model) {
        const modelMap = {

            'gemini-2.5-flash': 'gemini',

            'gemini-2.5-pro': 'gemini',


            'deepseek/deepseek-chat-v3.1:free': 'deepseek',

        };

        return modelMap[model] || 'fallback';
    }
    /**
     * Vérifier si le modèle supporte l'arabe nativement
     */
    isArabicSupported(model) {
        const arabicModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'deepseek/deepseek-chat-v3.1:free'];
        return arabicModels.includes(model);
    }

    /**
     * Obtenir la liste des modèles disponibles
     */
    getAvailableModels() {
        const models = [];


        if (this.gemini) {

            models.push(
                {
                    id: 'gemini-2.5-flash',
                    name: 'gemini Flash',
                    provider: 'Google',
                    premium: false
                },
                {
                    id: 'gemini-2.5-pro',
                    name: 'Gemini Pro',
                    provider: 'Google',
                    premium: false
                }
            );
        }



        // if (process.env.DEEPSEEK_API_KEY) {
        //     models.push(
        //         {
        //             id: 'deepseek/deepseek-chat-v3.1:free',
        //             name: 'DeepSeek',
        //             provider: 'DeepSeek',
        //             premium: false
        //         },


        //     );
        // }

        // Toujours ajouter un modèle fallback

        // models.push(
        //     {
        //         id: 'llama-3.3-8b-instruct',
        //         name: 'Llama 3.3 8B Instruct',
        //         provider: 'Meta',
        //         premium: false
        //     }
        // );


        return models;
    }

    /**
     * Vérifier la santé des services AI
     */
    async healthCheck() {
        const health = {
            openai: false,
            gemini: false,
            huggingface: false,
            deepseek: false,
        };

        // Test OpenAI
        if (this.openai) {
            try {
                await this.openai.models.list();
                health.openai = true;
            } catch (error) {
                logger.error('OpenAI health check failed:', error.message);
            }
        }

        // Test Gemini
        if (this.gemini) {
            try {
                const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
                await model.generateContent('Test');
                health.gemini = true;
            } catch (error) {
                logger.error('Gemini health check failed:', error.message);
            }
        }

        // Test Hugging Face
        if (this.huggingface) {
            try {
                await axios.get('https://api-inference.huggingface.co/status', {
                    headers: {
                        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    },
                });
                health.huggingface = true;
            } catch (error) {
                logger.error('Hugging Face health check failed:', error.message);
            }
        }

        return health;
    }
}

module.exports = new AIService();