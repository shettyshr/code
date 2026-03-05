import AsyncStorage from '@react-native-async-storage/async-storage';
import {LoyaltyProgram} from './types';

const STORAGE_KEY = '@loyalty_programs';

export async function loadPrograms(): Promise<LoyaltyProgram[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function savePrograms(programs: LoyaltyProgram[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}
