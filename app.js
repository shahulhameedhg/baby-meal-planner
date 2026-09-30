const $ = id => document.getElementById(id);
let plan = [];
let deferredPrompt = null;

const pad = n => String(n).padStart(2,"0");
function toISO(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function fromISO(s){const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d);}
function addDays(d,n){const x=new Date(d); x.setDate(x.getDate()+n); return x;}
function dayDiff(a,b){return Math.floor((a-b)/86400000);}

function defaultStart(){
  const saved=localStorage.getItem("babyMealStart");
  return saved || toISO(new Date());
}
function setStart(v){
  localStorage.setItem("babyMealStart",v);
  $("startDate").value=v;
}
function setSelected(v){
  $("selectedDate").value=v;
  render();
}

async function loadPlan(){
  const res=await fetch("plan.json");
  plan=await res.json();
  const start=defaultStart();
  setStart(start);
  const savedSelected=localStorage.getItem("babyMealSelected") || start;
  $("selectedDate").value=savedSelected;
  render();
}
function render(){
  if(!plan.length)return;
  const start=fromISO($("startDate").value);
  const selected=fromISO($("selectedDate").value);
  const n=dayDiff(selected,start);
  localStorage.setItem("babyMealSelected",$("selectedDate").value);

  if(n<0 || n>=plan.length){
    $("planView").classList.add("hidden");
    $("outOfRange").classList.remove("hidden");
    $("outOfRange").textContent=`Selected date is outside the 42-day plan. Choose a date from ${$("startDate").value} through ${toISO(addDays(start,41))}.`;
    return;
  }
  $("outOfRange").classList.add("hidden");
  $("planView").classList.remove("hidden");

  const item=plan[n];
  const pretty=selected.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("dateText").textContent=pretty;
  $("dayNumber").textContent=`Day ${item.day} of 42`;
  $("fruitBadge").textContent=`🍌 ${item.fruit}`;
  $("vegBadge").textContent=`🥕 ${item.vegetable}`;
  $("breakfast").textContent=item.breakfast;
  $("lunch").textContent=item.lunch;
  $("fruitMeal").textContent=item.fruitMeal;
  $("dinner").textContent=item.dinner;

  const fruitStart=n-(n%5)+1;
  const fruitEnd=Math.min(fruitStart+4,42);
  $("rotationFruit").textContent=`${item.fruit} • Days ${fruitStart}–${fruitEnd}`;

  const vegStart=n-(n%5)+1;
  const vegEnd=Math.min(vegStart+4,42);
  $("rotationVeg").textContent=`${item.vegetable} • Days ${vegStart}–${vegEnd}`;
}

$("startDate").addEventListener("change",()=>{
  setStart($("startDate").value);
  setSelected($("startDate").value);
});
$("selectedDate").addEventListener("change",render);
$("prevBtn").addEventListener("click",()=>{
  setSelected(toISO(addDays(fromISO($("selectedDate").value),-1)));
});
$("nextBtn").addEventListener("click",()=>{
  setSelected(toISO(addDays(fromISO($("selectedDate").value),1)));
});
$("todayBtn").addEventListener("click",()=>setSelected(toISO(new Date())));
$("printBtn").addEventListener("click",()=>window.print());

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e; $("installBtn").classList.remove("hidden");
});
$("installBtn").addEventListener("click",async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  $("installBtn").classList.add("hidden");
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
loadPlan().catch(err=>{
  $("outOfRange").classList.remove("hidden");
  $("outOfRange").textContent="Could not load the meal-plan data. Make sure plan.json is uploaded with the app.";
});
