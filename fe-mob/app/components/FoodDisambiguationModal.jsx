import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'https://nutriliz-be-a8351183c68f.herokuapp.com/'; //update this to your backend IP address

/**
 * FoodDisambiguationModal
 *
 * Shown when the AI is uncertain about a food's identity (unlabeled liquids,
 * or dishes obscured by sauces/dressings). Presents the AI's top alternatives
 * as radio-button choices plus a free-text "Other" option that is validated
 * against the image context before proceeding.
 *
 * Props:
 *   visible        – boolean
 *   alternatives   – string[]  (2-3 candidate names from the AI)
 *   foodContext    – { food_name, category, description }  (original AI result)
 *   onConfirm      – (resolvedName: string) => void
 *   onDismiss      – () => void  (user cancelled; scan should reset)
 */
export default function FoodDisambiguationModal({
  visible,
  alternatives = [],
  foodContext = {},
  onConfirm,
  onDismiss,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null); // 0..n-1 or 'other'
  const [customInput, setCustomInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const optionsScrollRef = useRef(null);

  useEffect(() => {
    if (selectedIndex === 'other' && validationError && optionsScrollRef.current) {
      requestAnimationFrame(() => {
        optionsScrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [selectedIndex, validationError]);

  const resetState = useCallback(() => {
    setSelectedIndex(null);
    setCustomInput('');
    setValidating(false);
    setValidationError('');
  }, []);

  const handleConfirm = async () => {
    if (selectedIndex === null) {
      setValidationError('Please select an option before continuing.');
      return;
    }

    if (selectedIndex === 'other') {
      const trimmed = customInput.trim();
      if (!trimmed) {
        setValidationError('Please type the food name in the text box.');
        return;
      }
      setValidating(true);
      setValidationError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/validate-food-input`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            food_name: trimmed,
            context: foodContext,
          }),
        });
        const data = await response.json();
        setValidating(false);
        if (data.valid) {
          const resolvedName = data.sanitized_name || trimmed;
          resetState();
          onConfirm(resolvedName);
        } else {
          setValidationError(
            data.reason || 'That doesn\'t appear to be a food or beverage. Please try another name.'
          );
        }
      } catch {
        setValidating(false);
        setValidationError('Could not validate the name. Please check your connection and try again.');
      }
      return;
    }

    // User picked one of the AI alternatives
    const resolvedName = alternatives[selectedIndex];
    resetState();
    onConfirm(resolvedName);
  };

  const handleDismiss = () => {
    resetState();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Ionicons name="help-circle-outline" size={42} color="#1e7d5d" style={styles.icon} />
          <Text style={styles.title}>Clarify Your Food</Text>
          <Text style={styles.subtitle}>
            We're not fully certain what this is. Select the most accurate option or enter the name yourself.
          </Text>

          <ScrollView
            ref={optionsScrollRef}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {alternatives.map((name, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedIndex(index);
                  setValidationError('');
                }}
              >
                <View style={[styles.radio, selectedIndex === index && styles.radioSelected]}>
                  {selectedIndex === index && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{name}</Text>
              </TouchableOpacity>
            ))}

            {/* "Other" option with inline text input */}
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedIndex('other');
                setValidationError('');
              }}
            >
              <View style={[styles.radio, selectedIndex === 'other' && styles.radioSelected]}>
                {selectedIndex === 'other' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>Other</Text>
            </TouchableOpacity>

            {selectedIndex === 'other' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    validationError && styles.textInputError,
                  ]}
                  placeholder="Type the food or beverage name…"
                  placeholderTextColor="#aaa"
                  value={customInput}
                  onChangeText={(text) => {
                    setCustomInput(text);
                    setValidationError('');
                  }}
                  maxLength={100}
                  returnKeyType="done"
                  autoFocus
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Only the closest matching names are accepted based on the captured image.
                </Text>
              </View>
            )}

            {validationError ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color="#d32f2f" />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleDismiss} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (selectedIndex === null || validating) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedIndex === null || validating}
              activeOpacity={0.8}
            >
              {validating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e7d5d',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#1e7d5d',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#1e7d5d',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  inputContainer: {
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 36,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#1e7d5d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#f9f9f9',
  },
  textInputError: {
    borderColor: '#d32f2f',
  },
  inputHint: {
    fontSize: 11,
    color: '#888',
    marginTop: 5,
    marginLeft: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 22,
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#1e7d5d',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#a0c9bc',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
