# Computes party shares by locality from CEC expc.csv files (media21..media25.bechirot.gov.il/files/expc.csv)
# and CBS localities file bycode2022.xlsx (cbs.gov.il/he/publications/doclib/2019/ishuvim/bycode2022.xlsx). Run in a folder holding expc21..25.csv and bycode.xlsx.
import pandas as pd, io, json
def load(n):
    raw=open(f'expc{n}.csv','rb').read()
    t=raw.decode('utf-8-sig' if n==25 else 'cp1255')
    df=pd.read_csv(io.StringIO(t))
    df=df.loc[:,~df.columns.str.startswith('Unnamed')]
    df.columns=[c.strip() for c in df.columns]
    return df
# party letter maps
M={
21:{'מחל':'Likud','פה':'Blue and White','אמת':'Labor','מרצ':'Meretz','ל':'Yisrael Beiteinu','שס':'Shas','ג':'UTJ','טב':'URWP','נ':'New Right','כ':'Kulanu','ז':'Zehut','דעם':'Hadash-Taal','ום':'Raam-Balad'},
22:{'מחל':'Likud','פה':'Blue and White','אמת':'Labor-Gesher','מרצ':'Democratic Union','ל':'Yisrael Beiteinu','שס':'Shas','ג':'UTJ','טב':'Yamina','כ':'Otzma Yehudit','ודעם':'Joint List'},
23:{'מחל':'Likud','פה':'Blue and White','אמת':'Labor-Gesher-Meretz','ל':'Yisrael Beiteinu','שס':'Shas','ג':'UTJ','טב':'Yamina','נץ':'Otzma Yehudit','ודעם':'Joint List'},
24:{'מחל':'Likud','פה':'Yesh Atid','כן':'Blue and White','אמת':'Labor','מרצ':'Meretz','ל':'Yisrael Beiteinu','שס':'Shas','ג':'UTJ','ב':'Yamina','ת':'New Hope','ט':'Religious Zionism','ודעם':'Joint List','עם':'Raam'},
25:{'מחל':'Likud','פה':'Yesh Atid','כן':'National Unity','אמת':'Labor','מרצ':'Meretz','ל':'Yisrael Beiteinu','שס':'Shas','ג':'UTJ','ב':'Jewish Home','ט':'RZ-Otzma','ום':'Hadash-Taal','ד':'Balad','עם':'Raam'},
}
E={21:'2019-04',22:'2019-09',23:'2020-03',24:'2021-03',25:'2022-11'}
cities={5000:'Tel Aviv-Yafo',2650:'Ramat HaSharon',6300:'Givatayim',6400:'Herzliya',4000:'Haifa',6900:'Kfar Saba',8700:"Ra'anana",9700:'Hod HaSharon'}
loc=pd.read_excel('bycode.xlsx')
kib=set(loc[(loc['צורת יישוב שוטפת']==330)&(loc['השתייכות ארגונית']==15)]['סמל יישוב'])
out={}
for n in E:
    df=load(n)
    code='סמל ישוב'
    parties=[c for c in df.columns if c not in ('סמל ועדה','שם ישוב','סמל ישוב','בזב','מצביעים','פסולים','כשרים')]
    # national includes all rows
    def summ(sub,label):
        valid=sub['כשרים'].sum(); elig=sub['בזב'].sum(); voters=sub['מצביעים'].sum()
        sh={M[n].get(p,p):round(100*sub[p].sum()/valid,1) for p in parties}
        top={k:v for k,v in sorted(sh.items(),key=lambda x:-x[1]) if v>=1.0}
        return {'valid':int(valid),'eligible':int(elig),'turnout_pct':round(100*voters/elig,1) if elig else None,'shares':top}
    out[E[n]]={'National (all ballot rows)':summ(df,'nat')}
    for c,name in cities.items():
        s=df[df[code]==c]
        out[E[n]][name]=summ(s,name)
    ks=df[df[code].isin(kib)]
    out[E[n]]['Kibbutz Movement kibbutzim (%d matched)'%ks[code].nunique()]=summ(ks,'kib')
json.dump(out,open('results.json','w'),ensure_ascii=False,indent=1)
for e in out:
    print('=====',e)
    for k,v in out[e].items(): print(k, v['turnout_pct'], list(v['shares'].items())[:9])
