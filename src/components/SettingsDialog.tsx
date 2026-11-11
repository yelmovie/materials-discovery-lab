import {useGame} from '../state/GameContext';
import {settingsContent as text} from '../settingsContent';
import {Modal} from './Modal';
import type {Phase} from '../domain/model';
import {screens as activitySpecs} from '../../docs/screen-spec.json';
export function SettingsDialog({onClose,onStory,onEvidence,onReset,onFinal}:{onClose:()=>void;onStory:()=>void;onEvidence:()=>void;onReset:()=>void;onFinal:(phase:Phase)=>void}){
 const {save,demo,dispatch}=useGame();const s=save.settings;
 return <Modal title="설정" className="settings-dialog" onClose={onClose}>
 <header className="settings-header"><span className="eyebrow">공방 사용 안내</span><h2>나에게 맞게 설정해요</h2></header>
 <div className="settings-body">
 <label className="setting-toggle"><span>배경 음악</span><input type="checkbox" role="switch" checked={s.bgm>0&&!s.muted} onChange={e=>dispatch({type:'settings',value:e.target.checked?{bgm:.2,muted:false}:{bgm:0}})}/></label>
 <label className="setting-toggle"><span>효과음</span><input type="checkbox" role="switch" checked={s.sfx>0&&!s.muted} onChange={e=>dispatch({type:'settings',value:e.target.checked?{sfx:.4,muted:false}:{sfx:0}})}/></label>
 <label className="field">배경 음악 크기 · {Math.round(s.bgm*20)*5}%<input aria-label="배경 음악 크기" type="range" min="0" max="100" step="5" disabled={s.bgm===0||s.muted} value={Math.round(s.bgm*20)*5} onChange={e=>dispatch({type:'settings',value:{bgm:Number(e.target.value)/100}})}/></label>
 <label className="setting-toggle"><span>움직임 줄이기</span><input type="checkbox" role="switch" checked={s.reducedMotion} onChange={e=>dispatch({type:'settings',value:{reducedMotion:e.target.checked}})}/></label>
 <div className="settings-shortcuts"><button className="secondary full" onClick={onStory}>공방을 깨우는 이유 다시 보기</button>
 <button className="secondary full" disabled={!save.coreComplete&&!demo} onClick={()=>onFinal('ending')}>{save.coreComplete||demo?'공방 복구 이야기 다시 보기':'끝까지 마치면 복구 이야기가 열려요'}</button>
 <button className="secondary full" disabled={!save.coreComplete&&!demo} onClick={()=>onFinal('certificate')}>{save.coreComplete||demo?'연구원 인증서 받기':'공방을 모두 복구하면 인증서가 열려요'}</button>
 <button className="secondary full" onClick={onEvidence}>나의 연구 수첩 펼치기</button></div>
 <details className="settings-section"><summary>앱 정보 · 배움과 보상</summary><p><b>탐구 목적</b> {text.purpose}</p><p><b>미션 보상</b> {text.reward}</p><p><b>남는 배움</b> {text.learning}</p><p className="settings-note">물질 공방 대작전 v{text.version}<br/>기획·제작: 옐샘 & 아이스크림미디어</p></details>
 <details className="settings-section"><summary>학생용 가이드</summary>{text.student.map(t=><p key={t}>{t}</p>)}</details>
 <details className="settings-section"><summary>교사용 가이드</summary>{text.teacher.map(t=><p key={t}>{t}</p>)}
 <details><summary>성취기준</summary><p>2022 개정 교육과정과 연계한 탐구 보조 활동이에요. 이 게임만으로 성취기준 전체를 달성했다고 판단하지 않으며, 수업·토론·후속 평가와 함께 활용해 주세요.</p>{text.standards.map(t=><p key={t}>{t}</p>)}
 <details><summary>활동별 학습 목표 · 교사 검토 대기 {activitySpecs.filter(activity=>activity.needsReview).length}개</summary>
 <p>성취기준 출처: {text.source}</p>
 <p>성취기준 문구는 원문과 대조했어요. 활동별 학습 목표의 수업 적합성은 교사 검토를 기다리고 있어요.</p>
 {activitySpecs.map(activity=><div key={activity.id}><p><b>{activity.id} · {activity.title}</b><br/>{activity.standards.map(standard=>`[${standard}]`).join(' · ')}{activity.needsReview?' · 교사 검토 대기':''}</p>{activity.learningObjectives.map(objective=><p key={objective}>{objective}</p>)}</div>)}
 </details></details>
 <details><summary>교사용 도구</summary><p>모든 미션의 단계를 한꺼번에 열어요. 학생 완료 기록을 만들지 않는 별도 시연이에요. 다시 누르면 학생의 원래 진행으로 돌아가요.</p><p>시연 중 활동 화면 왼쪽 아래 ◀ ▶ 버튼이나 키보드 ← → 키로 14단계를 넘기고, 오른쪽 아래 ‘다음 스테이지’로 다음 공방에 바로 가요.</p><button className="secondary full" aria-label="관리자 전체 해금" aria-pressed={demo} onClick={()=>dispatch({type:'demo',enabled:!demo})}>{demo?'모두 열림 · 다시 누르면 닫기':'모든 단계 한 번에 열기'}</button>{demo&&<p className="settings-note">시연 중이에요. 설정을 닫고 지도의 공방을 선택해 주세요.</p>}</details></details>
 <details className="settings-section"><summary>이미지·소리·저작권 고지</summary>{text.copyright.map(t=><p key={t}>{t}</p>)}<details><summary>자료 출처 모아 보기</summary><p><b>학습 기준</b><br/>{text.source}</p><p><b>다섯 공방</b><br/>사용자 제공 배경·캐릭터 시트, 프로젝트 AI 생성 이미지. 상업 이용 권리는 납품 전 별도로 확인해요.</p><p><b>프로그램</b><br/>React · Vite · Phaser · TypeScript · MIT 라이선스</p></details><p>ⓒ {new Date().getFullYear()} 옐샘 & 아이스크림미디어</p><p>자체 제작물의 무단 복제·재배포를 금해요.</p><p>외부 자료는 각 원저작자의 이용 조건을 따라요.</p></details>
 </div><footer className="settings-footer"><button className="danger-action" onClick={onReset}>연구 기록 초기화</button><button className="primary" onClick={onClose}>닫기</button></footer>
 </Modal>;
}

