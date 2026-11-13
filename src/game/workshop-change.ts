import {MAP_WIDTH,MAP_HEIGHT} from '../domain/worldMap';

type XY=[number,number];
// These silhouettes follow the painted roofs, walls and doorways. Keeping
// bushes and paths outside the masks makes each restoration read as a building.
const buildings: {shape:XY[];door:XY;accent:string}[]=[
 {shape:[[143,69],[185,36],[227,29],[263,36],[266,28],[280,24],[280,49],[308,63],[331,95],[321,129],[288,148],[242,151],[195,145],[142,124]],door:[250,117],accent:'#efa44d'},
 {shape:[[555,65],[577,48],[587,22],[599,20],[604,38],[635,24],[659,24],[681,10],[706,10],[724,36],[747,46],[750,63],[740,77],[752,93],[747,127],[717,145],[669,152],[623,151],[582,139],[553,106]],door:[628,125],accent:'#d497e7'},
 {shape:[[673,232],[714,214],[749,201],[775,210],[807,210],[826,229],[838,252],[846,267],[846,302],[811,328],[754,338],[711,327],[687,316],[663,296]],door:[724,298],accent:'#64e8e7'},
 {shape:[[529,369],[572,381],[604,388],[587,306],[614,300],[633,354],[632,377],[666,395],[690,370],[710,378],[711,400],[692,429],[719,447],[708,466],[701,502],[665,525],[600,529],[554,501],[559,467],[527,462],[515,417]],door:[629,490],accent:'#a8e28b'},
 {shape:[[74,385],[110,357],[127,338],[159,333],[184,343],[199,323],[214,317],[219,333],[236,332],[246,352],[255,372],[284,396],[306,416],[291,453],[249,466],[193,470],[145,455],[91,435],[67,410]],door:[226,421],accent:'#e4b66d'},
 {shape:[[417,256],[432,231],[442,207],[451,192],[463,204],[477,241],[489,251],[494,267],[475,283],[429,281]],door:[453,269],accent:'#84eeed'},
];
export function drawWorkshopChange(source:HTMLImageElement,index:number,restored:boolean){
 const {shape,door,accent}=buildings[index],s=MAP_WIDTH/900;
 const x=Math.floor(Math.min(...shape.map(p=>p[0]))*s)-5,y=Math.floor(Math.min(...shape.map(p=>p[1]))*s)-5;
 const canvas=document.createElement('canvas');
 canvas.width=Math.ceil(Math.max(...shape.map(p=>p[0]))*s-x)+6;
 canvas.height=Math.ceil(Math.max(...shape.map(p=>p[1]))*s-y)+6;
 const c=canvas.getContext('2d')!;
 c.translate(-x,-y);c.save();c.scale(s,s);
 c.beginPath();shape.forEach(([a,b],n)=>n?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.clip();c.scale(1/s,1/s);
 c.drawImage(source,0,0,MAP_WIDTH,MAP_HEIGHT);
 if(!restored){
  c.globalCompositeOperation='saturation';c.fillStyle='#888';c.fillRect(x,y,canvas.width,canvas.height);
  c.globalCompositeOperation='source-over';c.fillStyle='rgba(40,57,64,.46)';c.fillRect(x,y,canvas.width,canvas.height);
  if(index!==5){const [a,b]=door.map(k=>k*s);c.fillStyle='#4e3a2c';c.fillRect(a-12,b-12,24,13);c.fillStyle='#8e6945';c.fillRect(a-14,b-11,28,4);c.fillRect(a-11,b-4,23,4);}
  c.restore();return {canvas,x,y};
 }
 c.restore();c.scale(s,s);
 // A lit doorway and functional equipment appear in the entrance, rather
 // than covering the roofs with a badge. The core opens its lanterns last.
 const [a,b]=door;
 c.translate(a,b);c.fillStyle='#77574188';c.beginPath();c.ellipse(0,13,20,5,0,0,Math.PI*2);c.fill();
 const glow=c.createRadialGradient(0,0,1,0,0,29);glow.addColorStop(0,accent+'a8');glow.addColorStop(1,accent+'00');c.fillStyle=glow;c.fillRect(-29,-29,58,58);
 const box=(x:number,y:number,w:number,h:number,fill:string)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
 const poly=(points:XY[],fill:string)=>{c.fillStyle=fill;c.beginPath();points.forEach(([x,y],n)=>n?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const dot=(x:number,y:number,r:number,fill:string)=>{c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 if(index===5){for(const [a,b] of [[-20,6],[0,13],[20,6]]){box(a-1,b,2,9,'#805631');dot(a,b,4,'#ffce69');dot(a-1,b-1,2,'#fff2be');}}
 else{
  box(-6,-7,12,16,'#55381f');box(-4,-5,8,12,'#ffdf8b');box(-3,-4,6,9,'#fff5bd');
  c.translate(17,8);
  if(index===0){box(-7,-3,14,4,'#8d5833');poly([[-6,-3],[-6,-9],[-2,-12],[-1,-4]],'#ead1a1');poly([[0,-3],[2,-8],[5,-9],[7,-3]],'#b98768');}
  if(index===1){box(-5,-10,10,13,'#6c665c');box(-4,-8,8,8,accent);box(-2,-7,4,5,'#f3f6e7');box(-7,1,14,3,'#bf9365');}
  if(index===2){box(-7,-8,14,12,'#456d71');box(-5,-6,10,7,accent);box(-5,-4,10,2,'#d6f3ec');box(-7,2,14,3,'#b78654');}
  if(index===3){box(-1,-12,3,17,'#896041');for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);poly([[0,0],[-3,-3],[0,-10],[4,-8]],accent);c.restore();}dot(0,0,2,'#f7d680');}
  if(index===4){box(-8,-3,16,4,'#825d39');box(-5,-9,10,6,'#cdedc1');box(-4,-8,8,2,'#537f69');box(-6,0,2,5,'#825d39');box(4,0,2,5,'#825d39');}
 }
 return {canvas,x,y};
}
