import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';

export interface StepItem {
  id: number;
  label: string;
}

export interface StepProgressTrackerProps {
  currentStep: number; // 1, 2, or 3
  steps?: StepItem[];
  style?: any;
}

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Education & License' },
  { id: 3, label: 'Clinic & Hospital' },
];

export function StepProgressTracker({
  currentStep,
  steps = DEFAULT_STEPS,
  style,
}: StepProgressTrackerProps) {
  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isUpcoming = step.id > currentStep;
        const hasNext = index < steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step Node */}
            <View style={styles.stepNodeContainer}>
              <View
                style={[
                  styles.nodeCircle,
                  isCompleted && styles.nodeCircleCompleted,
                  isActive && styles.nodeCircleActive,
                  isUpcoming && styles.nodeCircleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Check size={16} color="#ffffff" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.nodeNumber,
                      isActive ? styles.nodeNumberActive : styles.nodeNumberUpcoming,
                    ]}
                  >
                    {step.id}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isCompleted && styles.stepLabelCompleted,
                  isUpcoming && styles.stepLabelUpcoming,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connecting Bar */}
            {hasNext && (
              <View style={styles.connectingBarTrack}>
                <View
                  style={[
                    styles.connectingBarFill,
                    {
                      width: isCompleted ? '100%' : '0%',
                    },
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: 90,
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircleCompleted: {
    backgroundColor: StitchColors.primary,
  },
  nodeCircleActive: {
    backgroundColor: StitchColors.primary,
    borderWidth: 3,
    borderColor: StitchColors.primaryFixed,
  },
  nodeCircleUpcoming: {
    backgroundColor: StitchColors.surfaceContainer,
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  nodeNumberActive: {
    color: '#ffffff',
  },
  nodeNumberUpcoming: {
    color: StitchColors.outline,
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  stepLabelActive: {
    color: StitchColors.primary,
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: StitchColors.onSurfaceVariant,
    fontWeight: '500',
  },
  stepLabelUpcoming: {
    color: StitchColors.outline,
    fontWeight: '400',
  },
  connectingBarTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: StitchColors.surfaceContainerHighest,
    borderRadius: 9999,
    marginHorizontal: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  connectingBarFill: {
    height: '100%',
    backgroundColor: StitchColors.primary,
    borderRadius: 9999,
  },
});
