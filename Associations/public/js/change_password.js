document.addEventListener("DOMContentLoaded", function(){

    
    const password = document.getElementById("new_password")
    const repassword = document.getElementById("confirm_new_password")
    const submitBtn = document.getElementById("submit_btn")
    const passwordFeedback = document.getElementById("password_feedback")
    


    repassword.addEventListener("focusout", () => {
        if (password.value !== repassword.value) {
            passwordFeedback.innerText = "Passwords are not matching!"
            submitBtn.disabled = true
        } else {
            passwordFeedback.innerText = ""
            submitBtn.disabled = false   
        }
    }) 

    password.addEventListener("focusout", () => {
        if (password.value !== repassword.value) {
            passwordFeedback.innerText = "Passwords are not matching!"
            submitBtn.disabled = true
        } else {
            passwordFeedback.innerText = ""
            submitBtn.disabled = false   
        }
    }) 
});