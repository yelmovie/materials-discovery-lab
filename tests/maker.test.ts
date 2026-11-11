import {test,expect} from 'vitest';
import {makerOrders,evaluateOrder,validDelivery} from '../src/domain/maker';
import {freshSave,reduceSave,demoSave} from '../src/domain/model';
import {decodeSave} from '../src/services/storage';
for(const order of makerOrders){
 test(order.screen+' accepts tested function and rejects each wrong part',()=>{const parts=Object.fromEntries(order.slots.map(s=>[s.id,s.accept[0]]));expect(validDelivery(order.screen,parts)).toBe(true);for(const slot of order.slots){const wrong=slot.choices.find(c=>!slot.accept.includes(c.id))!;const failed={...parts,[slot.id]:wrong.id};expect(validDelivery(order.screen,failed)).toBe(false);expect(evaluateOrder(order,failed).find(r=>r.id===slot.id)?.feedback).toBe(slot.failure);}});
 test(order.screen+' cannot bypass investigation or forge delivery',()=>{let s=freshSave();const parts=Object.fromEntries(order.slots.map(s=>[s.id,s.accept[0]]));expect(reduceSave(s,{type:'deliver',screen:order.screen,parts,attempts:1}).deliveries).toEqual({});s=demoSave(s.settings);s=reduceSave(s,{type:'navigate',route:order.screen as never},true);s=reduceSave(s,{type:'deliver',screen:order.screen,parts,attempts:2},true);expect(s.deliveries[order.screen].attempts).toBe(2);expect(s.observations).toEqual(demoSave(s.settings).observations);});
}
test('old student saves keep progress with empty delivery archive',()=>{const s=freshSave();const old=JSON.parse(JSON.stringify(s));delete old.deliveries;expect(decodeSave(JSON.stringify(old)).deliveries).toEqual({});});
test('invalid delivery records are discarded without losing student data',()=>{const s=freshSave();s.name='연구원';s.deliveries={S02:{parts:{roof:'wrong'},attempts:1}};expect(decodeSave(JSON.stringify(s)).name).toBe('연구원');expect(decodeSave(JSON.stringify(s)).deliveries).toEqual({});});
