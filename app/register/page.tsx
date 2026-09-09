"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Register(){
  const [form, setForm] = useState({name:"", email:"", phone:"", password:"", county:"Bomet", position:"MCA", party:""})
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const router = useRouter()

  const submit = async (e)=>{
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/register",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if(res.ok){
      alert("Check email to verify! Then login.")
      router.push("/login?registered=1&email="+encodeURIComponent(form.email))
    }
    else{ alert(data.error || "Failed") }
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[440px] bg-[#111] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Create Private Profile</h1>
        <p className="text-sm text-white/50 mt-1">Secure Account • Email verification required</p>

        <div className="mt-6 space-y-4">
          <input required placeholder="Full Name - HON CHERUIYOT" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input required type="email" placeholder="Email - for login & verification" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <input required placeholder="Phone - 0758973109" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <select className="px-4 py-3 rounded-xl bg-black border border-white/10" value={form.county} onChange={e=>setForm({...form, county:e.target.value})}>
              <option>Bomet</option><option>Nairobi</option><option>Kisumu</option><option>Nakuru</option><option>Mombasa</option><option>Kajiado</option><option>Kericho</option>
            </select>
            <select className="px-4 py-3 rounded-xl bg-black border border-white/10" value={form.position} onChange={e=>setForm({...form, position:e.target.value})}>
              <option>MCA</option><option>MP</option><option>Senator</option><option>Governor</option><option>Woman Rep</option>
            </select>
          </div>
          <div className="relative">
            <input required type={show? "text":"password"} placeholder="Password min 6 chars" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10 pr-16" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
            <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-xs text-white/50">{show? "Hide":"Show"}</button>
          </div>
        </div>

        <button disabled={loading} className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold">{loading? "Creating..." : "Create Profile →"}</button>
        <div className="mt-4 text-center text-sm text-white/40">Already have account? <Link href="/login" className="text-white underline">Login</Link></div>
      </form>
    </div>
  )
}