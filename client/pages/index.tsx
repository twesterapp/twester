import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/ui/Button";

function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const _isAuth = !!window.localStorage.getItem("access-token");
    const _username = window.localStorage.getItem("username") || "";
    setIsAuth(_isAuth);
    setUsername(_username);

    if (!_isAuth) {
      router.push("/auth");
    }
  }, [isAuth, router]);

  if (isAuth) {
    // TODO: We will render the <App />
    return (
      <>
        <h1>You are logged in as {username}</h1>
        <Button
          text="Logout"
          onClick={() => {
            window.localStorage.removeItem("access-token");
            window.location.reload();
          }}
        />
      </>
    );
  }

  return null;
}

export default Home;
