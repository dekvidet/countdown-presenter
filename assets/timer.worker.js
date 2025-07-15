const s=new Set,c=o=>{for(const t of s)t.postMessage(o)};self.onconnect=o=>{const t=o.ports[0];s.add(t),t.onmessage=a=>{const{type:e,payload:n}=a.data;e==="update"&&c(n)},t.start()};
