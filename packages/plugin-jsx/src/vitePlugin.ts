import fs from 'fs' 
import Compiler from "./compiler";
const fileRegex = /\.(jsx)|(tsx)|(aio)$/;
export default function vitePlugin() {
    return {
      name: 'transform-file-movi-jsx', 
      transform(src:string, id:string) {  
        if (fileRegex.test(id)) {  
          var code = fs.readFileSync(id, 'utf-8')
          try {
            var result =  new Compiler().start(code,id);
            if (result) {  
              return { 
                code:result.code, 
                map:result.map
              } 
            } 
          } catch (error) {
            return {
              code: (error as Error).message,
              map:null
            }
          }
        } 
      }
    }
  }
   