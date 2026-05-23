import React from 'react';
import { View } from 'react-native';
import { Modal, Text, Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ActionModal ({
  visible,
  onDismiss,
  iconName,
  iconColor,
  title,
  message,
  primaryActionText,
  primaryActionColor,
  onPrimaryAction,
  showCancel = true,
  styles,
}) {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
    <View style={styles.modalContent}>
      <Ionicons name={iconName} size={48} color={iconColor} style={styles.modalIcon} />
      <Text style={styles.modalTitle}>{title}</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      
      <View style={showCancel ? styles.modalButtons : undefined}>
        {showCancel && (
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.cancelButton}
            textColor="#666"
          >
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={onPrimaryAction}
          style={showCancel ? styles.deleteButton : styles.okButton}
          buttonColor={primaryActionColor}
          textColor="#fff"
        >
          {primaryActionText}
        </Button>
      </View>
    </View>
  </Modal>
  );
}