import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const begin=code.indexOf('const WORK_SCREEN_KEYS='),end=code.indexOf('function headerTitle(){',begin);
assert.ok(begin>0&&end>begin,'Work navigation functions are present');
const source=code.slice(begin,end);
const permitted={
 admin:['tasks','create','approvals','recurring','stats'],
 manager:['tasks','create','approvals','recurring','stats'],
 lead:['tasks','create','approvals'],
 staff:['tasks']
};
const renderFor=(who)=>{
 const state={screen:'workhub'};
 const factory=new Function('manager','supervisor','admin','state','myNotifications','ic','esc',source+
  ';return {workMenuItems,navEntries,bottomItems,desktopNav,workhubView,inWorkGroup,WORK_SCREEN_KEYS};');
 const data=factory(
  ()=>['admin','manager'].includes(who),
  ()=>['admin','manager','lead'].includes(who),
  ()=>who==='admin',state,()=>[],x=>'<svg>'+x+'</svg>',x=>String(x)
 );
 const nav=data.navEntries().map(x=>x[0]);
 assert.ok(nav.includes('workhub'),'parent work tab missing');
 for(const child of permitted.admin)assert.ok(!nav.includes(child),'old work tab still in main menu: '+child);
 assert.ok(data.bottomItems().some(x=>x[0]==='workhub'),'bottom mobile work tab missing');
 assert.deepEqual(data.workMenuItems().map(x=>x[0]),permitted[who],'role-restricted child menu mismatch');
 const html=data.workhubView();
 assert.equal((html.match(/class="workhub-card"/g)||[]).length,permitted[who].length,'card count mismatch');
 for(const child of permitted[who])assert.match(html,new RegExp('data-screen="'+child+'"'));
 for(const child of permitted.admin.filter(x=>!permitted[who].includes(x)))
  assert.doesNotMatch(html,new RegExp('data-screen="'+child+'"'),'unauthorized work card visible: '+child);
 state.screen='tasks';
 assert.ok(data.inWorkGroup(),'old tasks screen not recognized as group child');
 assert.match(data.desktopNav(),/class="active" data-action="navigate" data-screen="workhub"/);
 state.screen='workhub';
 assert.ok(!data.inWorkGroup());
 console.log('PASS '+who+': '+permitted[who].join(','));
};
for(const role of ['admin','manager','lead','staff'])renderFor(role);
assert.match(code,/const views=\{workhub:workhubView/);
assert.match(code,/backToGroup=inWorkGroup\(\)/);
assert.match(code,/allowedScreens=new Set\(\[\.\.\.navEntries\(\),\.\.\.bottomItems\(\),\.\.\.workMenuItems\(\)\]/);
assert.match(code,/function tasksView\(\)/);
assert.match(code,/function createView\(\)/);
assert.match(code,/function approvalsView\(\)/);
assert.match(code,/function recurringView\(\)/);
assert.match(code,/function statsView\(\)/);
console.log('PASS: all five existing work screens remain mapped; only their navigation is grouped.');