import {describe,expect,it} from 'vitest';
import {contentSources,screens as activitySpecs} from '../docs/screen-spec.json';
import {screens as runtimeScreens} from '../src/domain/model';
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
  }
 });

 it('distinguishes the checked curriculum citation from classroom objectives still awaiting review',()=>{
  expect(contentSources.curriculum).toMatchObject({pdfPage:77,checkedAt:'2026-10-22'});
  expect(new URL(contentSources.curriculum.url).hostname).toBe('www.goe.go.kr');
  expect(contentSources.learningDesign).toMatchObject({path:'docs/PRD.md',sections:[2,4]});
  for(const activity of activitySpecs){
   expect(activity.source).toEqual({standards:'curriculum',learningObjectives:'learningDesign'});
   expect(activity.needsReview).toBe(true);
   expect(activity.reviewer).toBeNull();
  }
 });
});
