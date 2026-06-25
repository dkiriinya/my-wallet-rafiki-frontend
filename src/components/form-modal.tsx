import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import { X, Trash2, Check, Search, ChevronDown } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { stripEmoji } from '@/utils/icons';

// Searchable Dropdown Helper Component
interface DropdownOption {
  id: string | null;
  name: string;
}

interface SearchableDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
}

function SearchableDropdown({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select option...',
}: SearchableDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.id === selectedValue);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.dropdownFieldGroup}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.dropdownTrigger}
        activeOpacity={0.8}
        onPress={() => {
          setSearchQuery('');
          setModalVisible(true);
        }}
      >
        <Text style={[styles.dropdownTriggerText, !selectedOption && styles.dropdownPlaceholderText]}>
          {displayLabel}
        </Text>
        <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.dropdownOverlayBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownOverlayContainer}>
                <GlassView
                  style={styles.dropdownOverlayGlass}
                  glassEffectStyle="clear"
                  colorScheme="dark"
                />
                
                <View style={styles.dropdownOverlayHeader}>
                  <Text style={styles.dropdownOverlayTitle}>Select {label}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.dropdownCloseBtn}
                  >
                    <X size={18} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dropdownSearchWrapper}>
                  <Search size={18} color="rgba(255, 255, 255, 0.3)" style={styles.dropdownSearchIcon} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={styles.dropdownSearchInput}
                    autoFocus={true}
                    clearButtonMode="while-editing"
                  />
                </View>

                <ScrollView 
                  style={styles.dropdownOptionsList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {filteredOptions.length === 0 ? (
                    <Text style={styles.dropdownEmptyText}>No matching options found</Text>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = opt.id === selectedValue;
                      return (
                        <TouchableOpacity
                          key={opt.id === null ? 'null-option' : opt.id}
                          style={[styles.dropdownOptionItem, isSelected && styles.dropdownOptionItemActive]}
                          onPress={() => {
                            onSelect(opt.id);
                            setModalVisible(false);
                          }}
                        >
                          <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextActive]}>
                            {opt.name}
                          </Text>
                          {isSelected && <Check size={16} color="#6366F1" />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// Main FormModal Component (Full-Screen Page Overlay)
interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'account' | 'category' | 'transaction';
  mode: 'create' | 'edit';
  initialData?: any;
  accounts: any[];
  categories: any[];
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function FormModal({
  visible,
  onClose,
  type,
  mode,
  initialData,
  accounts,
  categories,
  onSubmit,
  onDelete,
}: FormModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState(''); // Balance, monthlyBudget, or amount
  const [description, setDescription] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setErrorMsg('');
      if (mode === 'edit' && initialData) {
        if (type === 'account') {
          setName(initialData.name || '');
          setValue(Math.abs(Number(initialData.balance || 0)).toString());
        } else if (type === 'category') {
          setName(initialData.name || '');
          setValue(Math.abs(Number(initialData.monthlyBudget || 0)).toString());
        } else if (type === 'transaction') {
          setDescription(initialData.description || '');
          const amt = Number(initialData.amount || 0);
          setValue(Math.abs(amt).toString());
          setTxType(amt < 0 ? 'expense' : 'income');
          setSelectedAccountId(initialData.accountId || '');
          setSelectedCategoryId(initialData.categoryId || null);
          setNeedsReview(initialData.needsReview || false);
        }
      } else {
        setName('');
        setValue('');
        setDescription('');
        setTxType(initialData?.txType || 'expense');
        setNeedsReview(false);
        if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
        } else {
          setSelectedAccountId('');
        }
        setSelectedCategoryId(null);
      }
    }
  }, [visible, mode, initialData, type, accounts]);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (type === 'account') {
        if (!name.trim()) throw new Error('Account name is required');
        const numVal = parseFloat(value) || 0;
        await onSubmit({
          name: name.trim(),
          balance: numVal.toFixed(2),
        });
      } else if (type === 'category') {
        if (!name.trim()) throw new Error('Budget name is required');
        const numVal = parseFloat(value) || 0;
        await onSubmit({
          name: name.trim(),
          monthlyBudget: numVal.toFixed(2),
        });
      } else if (type === 'transaction') {
        if (!description.trim()) throw new Error('Description is required');
        const numVal = parseFloat(value) || 0;
        if (!value.trim() || numVal <= 0) throw new Error('Valid amount is required');
        if (!selectedAccountId) throw new Error('Please select an account');

        const signedAmount = txType === 'expense' ? -numVal : numVal;
        await onSubmit({
          description: description.trim(),
          amount: signedAmount.toFixed(2),
          accountId: selectedAccountId,
          categoryId: txType === 'expense' ? selectedCategoryId : null,
          needsReview,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initialData?.id) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    const action = mode === 'edit' ? 'Edit' : 'Add';
    const entity = type === 'account' ? 'Account' : type === 'category' ? 'Budget' : 'Transaction';
    return `${action} ${entity}`;
  };

  // Build searchable dropdown options
  const accountOptions = accounts.map((acc) => ({
    id: acc.id,
    name: stripEmoji(acc.name),
  }));

  const categoryOptions = [
    { id: null, name: 'Uncategorized' },
    ...categories.map((cat) => ({
      id: cat.id,
      name: stripEmoji(cat.name),
    })),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <GlassView
          style={styles.glassBackground}
          glassEffectStyle="clear"
          colorScheme="dark"
        />
        
        <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Common Name Fields */}
              {type !== 'transaction' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={type === 'account' ? 'e.g. M-Pesa Wallet' : 'e.g. Living Expenses'}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={styles.textInput}
                    autoFocus={mode === 'create'}
                  />
                </View>
              )}

              {/* Transaction Description */}
              {type === 'transaction' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="e.g. Grocery Purchase Naivas"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={styles.textInput}
                    autoFocus={mode === 'create'}
                  />
                </View>
              )}

              {/* Amount / Value Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {type === 'account'
                    ? 'Current Balance (Ksh)'
                    : type === 'category'
                    ? 'Monthly Budget (Ksh)'
                    : 'Amount (Ksh)'}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="numeric"
                  style={[styles.textInput, styles.monoInput]}
                />
              </View>

              {/* Transaction Specific Selectors */}
              {type === 'transaction' && (
                <>
                  {/* Income / Expense Toggle */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Type</Text>
                    <View style={styles.typeToggleContainer}>
                      <TouchableOpacity
                        onPress={() => setTxType('expense')}
                        style={[
                          styles.typeToggleBtn,
                          txType === 'expense' && styles.typeToggleActiveExpense,
                        ]}
                      >
                        <Text style={[styles.typeToggleText, txType === 'expense' && styles.typeToggleTextActive]}>
                          Expense
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setTxType('income')}
                        style={[
                          styles.typeToggleBtn,
                          txType === 'income' && styles.typeToggleActiveIncome,
                        ]}
                      >
                        <Text style={[styles.typeToggleText, txType === 'income' && styles.typeToggleTextActive]}>
                          Income
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Searchable Account Dropdown */}
                  <SearchableDropdown
                    label="Account"
                    placeholder="Select payment method..."
                    selectedValue={selectedAccountId}
                    options={accountOptions}
                    onSelect={(val) => val && setSelectedAccountId(val)}
                  />

                  {/* Searchable Category Dropdown */}
                  {txType === 'expense' && (
                    <SearchableDropdown
                      label="Budget Category"
                      placeholder="Select category..."
                      selectedValue={selectedCategoryId}
                      options={categoryOptions}
                      onSelect={setSelectedCategoryId}
                    />
                  )}

                  {/* Needs Review switch */}
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelCol}>
                      <Text style={styles.switchLabel}>Needs Review</Text>
                      <Text style={styles.switchDesc}>Mark if details are unconfirmed</Text>
                    </View>
                    <Switch
                      value={needsReview}
                      onValueChange={setNeedsReview}
                      trackColor={{ false: '#3F3F46', true: '#6366F1' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[styles.btn, styles.submitBtn]}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Processing...' : mode === 'edit' ? 'Save Changes' : 'Add Item'}
                  </Text>
                </TouchableOpacity>

                {mode === 'edit' && onDelete && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    disabled={submitting}
                    style={[styles.btn, styles.deleteBtn]}
                  >
                    <Trash2 size={18} color="#EF4444" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Component & Helper Styles
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 20, 0.98)',
  },
  safeContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#FFFFFF',
  },
  monoInput: {
    fontFamily: 'Inter',
    fontSize: 16,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  typeToggleActiveExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  typeToggleActiveIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 4,
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 12,
    color: '#71717A',
  },
  actionContainer: {
    gap: 12,
    marginTop: 10,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitBtn: {
    backgroundColor: '#6366F1',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },

  // Dropdown Styles
  dropdownFieldGroup: {
    marginBottom: 20,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  dropdownOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dropdownOverlayContainer: {
    height: '75%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    overflow: 'hidden',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  dropdownOverlayGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 20, 0.98)',
  },
  dropdownOverlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownOverlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dropdownCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dropdownSearchIcon: {
    marginRight: 10,
  },
  dropdownSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dropdownOptionsList: {
    flex: 1,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dropdownOptionItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#E4E4E7',
  },
  dropdownOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdownEmptyText: {
    color: '#71717A',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
});
