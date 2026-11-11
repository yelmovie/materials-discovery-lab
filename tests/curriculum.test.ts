import {describe,expect,it} from 'vitest';
import {contentSources,screens as activitySpecs} from '../docs/screen-spec.json';
import {freshSave,screens as runtimeScreens,type Screen} from '../src/domain/model';
import {challengesFor} from '../src/domain/challenges';
import {keyConcepts} from '../src/domain/concepts';
import {decodeSave} from '../src/services/storage';
import {settingsContent} from '../src/settingsContent';

describe('teacher curriculum guide',()=>{
 it('maps every playable activity to its documented curriculum standard and learning goals',()=>{
  const expectedCodes=['4과05-01','4과05-02','4과05-03'];
  const expectedStandards=[0,0,0,0,1,1,1,1,2,2].map(i=>expectedCodes[i]);
  expect(activitySpecs).toHaveLength(10);
  expect(activitySpecs.map(activity=>activity.id)).toEqual(runtimeScreens.map(screen=>screen.id));
  expect(settingsContent.standards.map(text=>text.match(/^\[([^\]]+)\]/)?.[1])).toEqual(expectedCodes);
  expect(activitySpecs.map(activity=>activity.standards)).toEqual(expectedStandards.map(code=>[code]));
  for(const activity of activitySpecs){
   expect(activity.learningObjectives.length).toBeGreaterThan(0);
   expect(activity.learningObjectives.every(goal=>goal.trim().length>0)).toBe(true);
   expect(activity.learning.challengeIds).toEqual(challengesFor(activity.id as Screen).map(challenge=>challenge.id));
   expect([activity.learning.concept,activity.learning.progression,activity.learning.evidence,activity.learning.practice].every(text=>text.trim().length>0)).toBe(true);
   expect(Object.values(keyConcepts[activity.id as Screen]).every(text=>text.trim().length>0)).toBe(true);
  }
 });

 it('distinguishes the checked curriculum citation from classroom objectives still awaiting review',()=>{
  expect(contentSources.curriculum).toMatchObject({pdfPage:77,checkedAt:'2026-11-12'});
  expect(new URL(contentSources.curriculum.url).hostname).toBe('www.goe.go.kr');
  expect(new URL(contentSources.curriculum.noticeUrl).hostname).toBe('www.moe.go.kr');
  expect(contentSources.learningDesign).toMatchObject({path:'docs/PRD.md',sections:[2,4]});
  for(const activity of activitySpecs){
   expect(activity.source).toEqual({standards:'curriculum',learningObjectives:'learningDesign'});
   expect(activity.needsReview).toBe(true);
   expect(activity.reviewer).toBeNull();
   expect(activity.learning.scienceSources.every(source=>Object.hasOwn(contentSources.science,source))).toBe(true);
  }
 });

 it('keeps the original transfer-task answer IDs readable from an existing save',()=>{
  // Answer payloads recorded before the science wording review.
  const legacy:Record<string,string[]>={
   'S01-a':['parts'],'S01-b':['whole','record','compare'],
   'S02-a':['umbrella:object','wood:material','cup:object','metal:material'],'S02-b':['grain','record'],
   'S03-a':['water','time'],'S03-b':['transparent:light','restore:press','absorb:drop'],
   'S04-a':['both'],'S04-b':['need','compare','pick'],
   'S05-a':['place'],'S05-b':['outline:same','place:change','amount:same'],
   'S06-a':['return'],'S06-b':['grain','zoom'],
   'S07-a':['air'],'S07-b':['prepare','lower','observe'],
   'S08-a':['open','air','water'],'S08-b':['depth','direction'],
   'S09-a':['body:water','window:light','bumper:restore'],'S09-b':['evidence','test'],
   'S10-a':['new'],'S10-b':['why','result'],
  };
  const challengeResults=Object.entries(legacy).map(([id,answer])=>({id,answer}));
  const restored=decodeSave(JSON.stringify({...freshSave(),challengeResults}));
  expect(restored.challengeResults).toEqual(challengeResults);
 });
});
