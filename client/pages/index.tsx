import { useEffect } from "react";
import { useRouter } from "next/router";
import { isServer } from "@/utils";
import { Button } from "@/ui/Button";

function Home() {
  const router = useRouter();
  const isAuth = !isServer() && !!window.localStorage.getItem("access-token");
  const username = !isServer() ? window.localStorage.getItem("username") : "";

  useEffect(() => {
    if (!isAuth) {
      router.push("/login");
    }
  }, [isAuth, router]);

  // TODO: We will render the <App />
  if (isAuth) {
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
