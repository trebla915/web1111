import { Platform } from 'react-native';
import { auth as webAuth, db as webDb, storage as webStorage } from './firebase.web';
import { auth as nativeAuth, db as nativeDb, storage as nativeStorage } from './firebase.native';

export const auth = Platform.OS === 'web' ? webAuth : nativeAuth;
export const db = Platform.OS === 'web' ? webDb : nativeDb;
export const storage = Platform.OS === 'web' ? webStorage : nativeStorage; 