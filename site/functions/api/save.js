import {authenticate} from './_auth.js';
import {handleSave} from '../../lib/save-service.js';
export const onRequest = context => handleSave(context, authenticate);
