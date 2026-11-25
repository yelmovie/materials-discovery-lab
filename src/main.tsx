import {Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {GameProvider} from './state/GameContext';
import './styles.css';
import './experience.css';
import './stage-fit.css';
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){if(this.state.failed)return <div className="error-screen"><h1>실험 도구를 다시 준비해야 해</h1><p>저장한 연구 기록은 그대로야. 새로고침해서 이어 해 줘.</p><button onClick={()=>location.reload()}>다시 열기</button></div>;return this.props.children;}}
// Low-power devices (4 GB memory or 4 cores or fewer) drop the glass blur; layout-balance.css swaps in the opaque surfaces.
{const n=navigator as Navigator&{deviceMemory?:number};if((n.deviceMemory??8)<=4||(n.hardwareConcurrency||8)<=4)document.documentElement.dataset.lowPower='true';}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><GameProvider><App/></GameProvider></ErrorBoundary>);

import './glass-surfaces.css';
import './flow-polish.css';
import './layout-balance.css';
import './workshop-ui.css';
