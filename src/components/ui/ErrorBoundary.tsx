import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={36} color={Palette.danger} />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred while loading this view. You can try refreshing or returning home.
            </Text>

            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>Error Details:</Text>
                <Text style={styles.errorText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.retryButton}
              onPress={this.handleReset}
            >
              <RefreshCw size={16} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    maxWidth: 420,
    width: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.subtle,
  },
  errorLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.danger,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  btnIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
