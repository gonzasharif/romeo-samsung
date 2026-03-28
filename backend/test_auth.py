import asyncio
from utils.supabase_client import supabase

async def test():
    try:
        res = supabase.auth.sign_in_with_password({
            "email": "ada@company.com",
            "password": "testpassword"
        })
        print(res.session.access_token)
    except Exception as e:
        print("Login Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
