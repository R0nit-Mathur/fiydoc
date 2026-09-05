import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullscreen?: boolean;
  contentStyle?: any;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  fullscreen = false,
  contentStyle,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: fullscreen ? 8 : 16,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  {
                    width: '100%',
                    maxWidth: fullscreen ? 640 : 440,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    padding: 18,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.18,
                    shadowRadius: 20,
                    elevation: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  },
                  fullscreen
                    ? { height: '94%', display: 'flex', flexDirection: 'column' }
                    : { maxHeight: '90%' },
                  contentStyle,
                ]}
              >
                {title && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      marginBottom: 12,
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: '#0F172A',
                        flex: 1,
                        marginRight: 8,
                      }}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      activeOpacity={0.7}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                )}
                {fullscreen ? (
                  <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
                ) : (
                  <View style={{ flexShrink: 1 }}>{children}</View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  padding: 20,
                  maxHeight: '85%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 15,
                  elevation: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#E2E8F0',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 5,
                    backgroundColor: '#CBD5E1',
                    borderRadius: 99,
                    alignSelf: 'center',
                    marginBottom: 16,
                  }}
                />
                {title && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      marginBottom: 14,
                    }}
                  >
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
                      {title}
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ flexShrink: 1 }}>{children}</View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
