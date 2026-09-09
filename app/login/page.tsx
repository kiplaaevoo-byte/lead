  const submit = async (e:any)=>{
    e.preventDefault()
    setLoading(true)
    try{
      const res = await fetch("/api/login",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)})
      const data = await res.json()
      console.log("login response", data)
      if(res.ok){ 
        localStorage.setItem("siasa_user_id", data.politician.id)
        localStorage.setItem("siasa_phone", form.phone)
        window.location.href = "/dashboard" // force full reload
      }
      else{ alert(data.error) }
    }catch(err:any){
      alert(err.message)
    }finally{
      setLoading(false)
    }
  }