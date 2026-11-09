import {test,expect} from 'vitest';
import {freshSave,reduceSave,demoSave} from '../src/domain/model';
import {decodeSave} from '../src/services/storage';
test('restoration never awards evidence and rejects skipped or repeated steps',()=>{let s=freshSave();expect(reduceSave(s,{type:'restoreWorkshop',stage:0,step:1}).restoration).toEqual({});s.evidence=[{id:'E01',origin:'student',observationIds:[]}];expect(reduceSave(s,{type:'restoreWorkshop',stage:0,step:3}).restoration).toEqual({});for(const step of [1,2,3])s=reduceSave(s,{type:'restoreWorkshop',stage:0,step});expect(s.restoration[0]).toBe(3);expect(reduceSave(s,{type:'restoreWorkshop',stage:0,step:3})).toEqual(s);expect(s.completedScreens).toEqual([]);});
test('old saves retain progress and restore empty cosmetic state',()=>{const s=freshSave();const old=JSON.parse(JSON.stringify(s));delete old.restoration;expect(decodeSave(JSON.stringify(old)).restoration).toEqual({});});
