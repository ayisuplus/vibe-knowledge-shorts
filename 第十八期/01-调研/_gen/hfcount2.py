import json,re,sys,os,urllib.request,urllib.error,time
sys.stdout.reconfigure(encoding='utf-8')
UA={'User-Agent':'research-script/0.2 (single-thread, polite)'}
def get(url):
    for i in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60).read().decode('utf-8','replace')
        except urllib.error.HTTPError as e:
            if e.code==429: time.sleep(30*(i+1)); continue
            if e.code in (401,403,404): return None
            time.sleep(5)
        except Exception: time.sleep(5)
    return None
FAM=json.load(open('hf_fams.json',encoding='utf-8'))
TOP=int(sys.argv[1])
cache={}
if os.path.exists('hf_cache.jsonl'):
    for l in open('hf_cache.jsonl',encoding='utf-8'): d=json.loads(l); cache[d['id']]=d
cf=open('hf_cache.jsonl','a',encoding='utf-8')
res={}
for fam,srcs in FAM.items():
    ms=[]
    for a,rx in srcs:
        key='list:'+a
        if key in cache: data=cache[key]['data']
        else:
            t=get(f'https://huggingface.co/api/models?author={a}&limit=1000&sort=downloads&expand[]=createdAt&expand[]=downloads&expand[]=likes')
            data=[{k:m.get(k) for k in ('id','createdAt','downloads','likes')} for m in json.loads(t or '[]')]
            if t: cache[key]={'id':key,'data':data}; cf.write(json.dumps(cache[key],ensure_ascii=False)+'\n'); cf.flush()
            time.sleep(1)
        ms+=[m for m in data if re.search(rx,m['id'].split('/')[1])]
    ms=sorted(ms,key=lambda m:-(m.get('downloads') or 0))[:TOP]
    rows=[];fail=0
    for m in ms:
        mid=m['id']
        if mid not in cache:
            h=get('https://huggingface.co/'+mid)
            if h is None or 'Model tree' not in h and 'model tree' not in h.lower():
                d={'id':mid,'ok':False}
            else:
                d={'id':mid,'ok':True}
                for k in ('finetune','adapter','quantized','merge'):
                    mm=re.search(k+r':'+re.escape(mid)+r'">([\d,]+) model',h)
                    d[k]=int(mm.group(1).replace(',','')) if mm else 0
            cache[mid]=d; cf.write(json.dumps(d)+'\n'); cf.flush(); time.sleep(1.2)
        d=cache[mid]
        if not d.get('ok'): fail+=1; continue
        rows.append({**m,**{k:d[k] for k in ('finetune','adapter','quantized','merge')},'total':sum(d[k] for k in ('finetune','adapter','quantized','merge'))})
    rows.sort(key=lambda r:-r['total'])
    tot={k:sum(r[k] for r in rows) for k in ('finetune','adapter','quantized','merge','total')}
    res[fam]={'repos_checked':len(rows),'repos_failed':fail,'sum':tot,'top':rows[:8]}
    print(fam,len(rows),'fail',fail,tot,flush=True)
json.dump(res,open('hf_counts.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('done',time.strftime('%Y-%m-%d %H:%M'))
