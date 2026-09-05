import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullscreen?: boolean;
  contentStyle?: any;
}

export function Modal({ visible, onClose, title, children, fullscreen = false, contentStyle }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className={`flex-1 bg-black/60 justify-center items-center ${fullscreen ? 'p-2' : 'p-4'}`}>
          <TouchableWithoutFeedback>
            <View
              className={`w-full ${fullscreen ? 'max-w-2xl h-[94%]' : 'max-w-md max-h-[88%]'} bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 dark:border-slate-700`}
              style={[{ display: 'flex', flexDirection: 'column' }, contentStyle]}
            >
              {title && (
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3 flex-shrink-0">
                  <Text className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex-1 mr-2" numberOfLines={1}>
                    {title}
                  </Text>
                  <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flex: 1, minHeight: 0 }}>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

export function BottomSheet({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-5 shadow-2xl border-t border-slate-100 dark:border-slate-700 max-h-[85%]">
              <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full self-center mb-4" />
              {title && (
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    {title}
                  </Text>
                  <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
