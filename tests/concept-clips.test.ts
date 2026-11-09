import {describe,expect,it} from 'vitest';
import {concepts,CONCEPT_SECONDS,CONCEPT_CHAPTER_SECONDS} from '../src/domain/concepts';
// @ts-expect-error 영상 제작 스크립트는 타입 선언 없는 .mjs
import {SECONDS,CHAPTERS} from '../films/concept-clips/kit.mjs';

import manifest from '../public/assets/concepts/manifest.json';
// 실제로 있는 파일 목록(빌드 도구가 찾는 그대로)
const present=Object.keys(import.meta.glob('../public/assets/concepts/*.{mp4,webm,webp}')).map(p=>p.split('/').pop());

describe('개념영상 시간표',()=>{
 it('앱의 장면 시간과 영상 제작 시간표가 같다',()=>{
  expect(CONCEPT_SECONDS).toBe(SECONDS);
  expect(CHAPTERS).toEqual([0,CONCEPT_CHAPTER_SECONDS,CONCEPT_CHAPTER_SECONDS*2]);
  expect(CONCEPT_CHAPTER_SECONDS*3).toBe(CONCEPT_SECONDS);
 });
 it('10편 모두 같은 길이의 mp4·webm·포스터가 있고 편당 2.5MB 이하다',()=>{
  expect(manifest.clips.map(c=>c.id).sort()).toEqual(Object.keys(concepts).sort());
  for(const clip of manifest.clips){
   expect(clip.seconds).toBe(CONCEPT_SECONDS);
   expect(clip.files.map(f=>f.name).sort()).toEqual([`${clip.id}.mp4`,`${clip.id}.webm`,`${clip.id}.webp`]);
   for(const f of clip.files){
    expect(present).toContain(f.name);
    expect(f.bytes).toBeLessThanOrEqual(2.5*1024*1024);
   }
  }
 });
 it('장면마다 자막 문장이 하나씩 있다',()=>{
  for(const c of Object.values(concepts))expect(c.cues).toHaveLength(3);
 });
});
