(() => {
"use strict";
const DATA_FILE="Profiles.txt";
const list=document.getElementById("profileList");
const searchToggle=document.getElementById("searchToggle");
const searchPanel=document.getElementById("searchPanel");
const searchInput=document.getElementById("searchInput");
const clearSearch=document.getElementById("clearSearch");
const emptyState=document.getElementById("emptyState");
const errorState=document.getElementById("errorState");
let profiles=[],renderId=0;
function parseProfiles(raw){
  return raw.replace(/^\uFEFF/,"").split(/^\s*\$\s*$/m).map(block=>{
    const lines=block.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if(lines.length<3)return null;
    return {name:lines[0],photo:lines[1],url:lines[2]};
  }).filter(p=>p&&p.name&&p.url);
}
function httpUrl(value){
  try{const u=new URL(value,location.href);return u.protocol==="https:"||u.protocol==="http:"?u.href:""}catch(_){return ""}
}
function initials(name){
  const words=name.trim().split(/\s+/).filter(Boolean);
  return (words.length>1?words[0][0]+words[1][0]:(words[0]||"A").slice(0,2)).toUpperCase();
}
function createCard(profile){
  const card=document.createElement("a");card.className="profile-card";
  card.href=httpUrl(profile.url)||"#";card.target="_blank";card.rel="noopener noreferrer";
  card.setAttribute("aria-label",profile.name+" — open profile in a new tab");
  const avatarWrap=document.createElement("div");avatarWrap.className="avatar-wrap";
  const photoUrl=httpUrl(profile.photo);
  if(photoUrl){
    const img=document.createElement("img");img.className="avatar";img.src=photoUrl;
    img.alt=profile.name+" photo";img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";
    img.addEventListener("error",()=>{
      const fallback=document.createElement("div");fallback.className="avatar-fallback";
      fallback.textContent=initials(profile.name);avatarWrap.replaceChildren(fallback);
    },{once:true});avatarWrap.appendChild(img);
  }else{
    const fallback=document.createElement("div");fallback.className="avatar-fallback";
    fallback.textContent=initials(profile.name);avatarWrap.appendChild(fallback);
  }
  const info=document.createElement("div");info.className="profile-info";
  const name=document.createElement("span");name.className="profile-name";name.textContent=profile.name;
  const url=document.createElement("span");url.className="profile-url";url.textContent=profile.url;
  info.append(name,url);
  const arrow=document.createElement("span");arrow.className="profile-arrow";
  arrow.setAttribute("aria-hidden","true");arrow.textContent="›";
  card.append(avatarWrap,info,arrow);return card;
}
function render(){
  const current=++renderId,q=searchInput.value.trim().toLocaleLowerCase();
  const results=profiles.filter(p=>p.name.toLocaleLowerCase().includes(q)||p.url.toLocaleLowerCase().includes(q));
  list.replaceChildren();emptyState.hidden=results.length>0;errorState.hidden=true;
  let index=0;const batchSize=35;
  function appendBatch(){
    if(current!==renderId)return;
    const fragment=document.createDocumentFragment(),end=Math.min(index+batchSize,results.length);
    while(index<end)fragment.appendChild(createCard(results[index++]));
    list.appendChild(fragment);
    if(index<results.length){if("requestIdleCallback"in window)requestIdleCallback(appendBatch,{timeout:120});else setTimeout(appendBatch,0)}
  }
  if(results.length)appendBatch();
}
async function load(){
  try{const response=await fetch(DATA_FILE,{cache:"no-store"});if(!response.ok)throw new Error("HTTP "+response.status);
    profiles=parseProfiles(await response.text());render();
  }catch(err){list.replaceChildren();errorState.hidden=false;console.error("Could not load Profiles.txt",err)}
}
searchToggle.addEventListener("click",()=>{
  const opening=searchPanel.hidden;searchPanel.hidden=!opening;
  searchToggle.setAttribute("aria-expanded",String(opening));searchToggle.setAttribute("aria-label",opening?"Close search":"Open search");
  if(opening)searchInput.focus();else{searchInput.value="";clearSearch.hidden=true;render()}
});
searchInput.addEventListener("input",()=>{clearSearch.hidden=!searchInput.value;render()});
clearSearch.addEventListener("click",()=>{searchInput.value="";clearSearch.hidden=true;render();searchInput.focus()});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!searchPanel.hidden){searchPanel.hidden=true;searchToggle.setAttribute("aria-expanded","false");
    searchToggle.setAttribute("aria-label","Open search");searchInput.value="";clearSearch.hidden=true;render();searchToggle.focus()}
});
load();
})();
