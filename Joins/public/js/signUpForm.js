document.addEventListener("DOMContentLoaded", function(){

    const email = document.getElementById("email")
    const emailFeedback = document.getElementById("emailFeedback")
    const password = document.getElementById("password")
    const repassword = document.getElementById("repassword")
    const submitBtn = document.getElementById("submitBtn")
    const passwordFeedback = document.getElementById("passwordFeedback")
    
    let goodPassword = true
    let goodEmail = true


    repassword.addEventListener("focusout", () => {
        if (password.value !== repassword.value) {
            passwordFeedback.innerText = "Passwords are not matching!"
            submitBtn.disabled = true
            goodPassword = false
        } else {
            passwordFeedback.innerText = ""
            goodPassword = true
            if (goodEmail) {
                submitBtn.disabled = false   
            }
        }
    })


    email.addEventListener("focusout", () => {
        $.ajax({
            url: "emailExists/" + email.value,
            type: 'GET',
            dataType: "JSON",
            success: (existsJSON) => {
                if (existsJSON.exists) {
                    emailFeedback.innerText = "This email already exists on our system!"
                    submitBtn.disabled = true
                    goodEmail = false
                }else {
                    emailFeedback.innerText = ""
                    goodEmail = true
                    if (goodPassword) {
                        submitBtn.disabled = false
                    }
                        
                }
            }
        })
    })

   
    
});