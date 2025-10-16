import React, { useEffect, useState, useRef } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import chatService from '../../services/chatService';

const ModelSelector = ({ value, onChange, disabled }) => {
  const { t, i18n } = useTranslation();
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadModels = async () => {
    try {
      const response = await chatService.getAvailableModels();
      setModels(response.models);
    } catch (error) {
      console.error('Error loading models:', error);
      setModels([
        {
          id: 'gemini-2.5-flash',
          name: 'Gemini Flash',
          description: 'Modèle le plus intelligent. Efficace pour un usage quotidien.',
          provider: 'Google',
          premium: false,
        },
        {
          id: 'gemini-2.5-pro',
          name: 'Gemini Pro',
          description: 'Modèle avancé pour des tâches complexes et créatives.',
          provider: 'Google',
          premium: true,
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          description: 'Modèle rapide et efficace.',
          provider: 'DeepSeek',
          premium: false,
        },
        {
          id: 'llama-3.3',
          name: 'Llama 3.3 8B Instruct',
          description: 'Modèle open source performant.',
          provider: 'Meta',
          premium: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedModel = models.find(model => model.id === value) || models[0];
  const isRTL = i18n.language === 'ar';

  const handleSelectModel = (modelId) => {
    onChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bouton Principal */}
      <button
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="relative cursor-pointer rounded-xl hover:bg-gray-700 px-4 py-2.5 pr-10 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all  "
      >
        <span className="block truncate text-gray-400  text-sx " >
          {selectedModel?.name || t('chat.selectModel')}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''
              }`}
          />
        </span>
      </button>

      {/* Menu - TOUJOURS aligné à gauche (LTR) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-2 w-80 overflow-hidden rounded-xl bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] border border-gray-700 ${isRTL ? 'left-0' : 'right-0'
              }`}
            style={{ direction: 'ltr' }} // FORCE LTR pour le menu
          >
            {/* Modèle sélectionné */}
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-start gap-3">
                <CheckIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-white text-sm   " >
                    {selectedModel?.name}
                  </div>
                  {selectedModel?.description && (
                    <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                      {selectedModel.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton "Plus de modèles" */}
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors text-white group"
              onClick={(e) => {
                e.preventDefault();
                console.log('Voir plus de modèles');
                setIsOpen(false);
              }}
            >
              <span className="text-sm font-medium text-left">
                {t('chat.moreModels', 'Plus de modèles')}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
            </button>

            {/* Liste des modèles */}
            <div className="py-1 border-t border-gray-700 max-h-60 overflow-y-auto">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => !model.disabled && handleSelectModel(model.id)}
                  disabled={model.disabled}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${model.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${model.id === value ? 'bg-gray-750' : ''}`}
                >
                  {/* justify-between pour espace entre nom et check */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Nom à GAUCHE */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`${model.id === value ? 'font-semibold' : 'font-normal'
                          } text-white text-sm`}>
                          {model.name}
                        </span>
                        {model.premium && (
                          <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold">
                            PRO
                          </span>
                        )}
                      </div>
                      {model.description && (
                        <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                          {model.description}
                        </p>
                      )}
                    </div>

                    {/* Check à DROITE (visible uniquement si sélectionné) */}
                    <div className="flex-shrink-0">
                      {model.id === value && (
                        <CheckIcon className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;