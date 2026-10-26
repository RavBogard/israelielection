export function referenceRemoteTarget(actual:string,subject=actual){
 const destination=new URL(actual),signingSubject=new URL(subject);
 for(const url of [destination,signingSubject])if(url.protocol!=="https:"||url.pathname!=="/api/reference/worker"||url.search||url.hash||url.username||url.password)throw Error("invalid_worker_destination");
 return {destination,signingSubject};
}
