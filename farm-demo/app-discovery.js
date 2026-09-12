(function(){
  function ensureDiscovery(){
    if(!S.discovery||typeof S.discovery!=='object')S.discovery={};
    if(!S.discovery.crops||typeof S.discovery.crops!=='object')S.discovery.crops={};
    if(!S.discovery.mutants||typeof S.discovery.mutants!=='object')S.discovery.mutants={};
    for(const p of S.plots||[]){if(p&&p.crop&&C[p.crop])S.discovery.crops[p.crop]=1;if(p&&p.crop&&p.mut&&C[p.crop])S.discovery.mutants[p.crop]=1}
    for(const id of Object.keys(C)){
      if((S.inv?.prod?.[id]||0)>0)S.discovery.crops[id]=1;
      if((S.inv?.prod?.['m_'+id]||0)>0){S.discovery.crops[id]=1;S.discovery.mutants[id]=1}
    }
  }
  function markCrop(id){if(!C[id])return;ensureDiscovery();S.discovery.crops[id]=1}
  function markMutant(id){if(!C[id])return;ensureDiscovery();S.discovery.crops[id]=1;S.discovery.mutants[id]=1}
  window.cropDiscovered=id=>{ensureDiscovery();return !!S.discovery.crops[id]};
  window.mutantDiscovered=id=>{ensureDiscovery();return !!S.discovery.mutants[id]};
  window.discoveryCounts=()=>{ensureDiscovery();let ids=Object.keys(C);return{total:ids.length,crops:ids.filter(id=>S.discovery.crops[id]).length,mutants:ids.filter(id=>S.discovery.mutants[id]).length}};
  const baseClickPlot=window.clickPlot;
  window.clickPlot=function(i){
    const before=S.plots?.[i]?.crop||null;
    const result=baseClickPlot(i);
    const after=S.plots?.[i]?.crop||null;
    if(!before&&after){markCrop(after);save()}
    return result;
  };
  const baseMutate=window.mutate;
  window.mutate=function(p,q){
    const was=!!p?.mut,id=p?.crop;
    const result=baseMutate(p,q);
    if(!was&&p?.mut&&id){markMutant(id);save()}
    return result;
  };
  const baseHarvest=window.harvest;
  window.harvest=function(i){
    const p=S.plots?.[i],id=p?.crop,wasMut=!!p?.mut;
    if(id)markCrop(id);if(id&&wasMut)markMutant(id);
    const result=baseHarvest(i);save();return result;
  };
  ensureDiscovery();save();
})();