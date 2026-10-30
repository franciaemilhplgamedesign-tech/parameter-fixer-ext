function te(e){if(e.getMonth()!==10)return`default`;let t=e.getDate();return t>=11&&t<=26?`early-access`:t>=27&&t<=29?`weekend`:t===30?`cyber-monday`:`default`}
