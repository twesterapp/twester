import { useEffect } from "react";
import { useRouter } from "next/router";
import { isServer } from "@/utils";

function Home() {
  const router = useRouter();
  const isAuth = !isServer() && !!window.localStorage.getItem("access-token");
  const username = !isServer() ? window.localStorage.getItem("username") : "";

  useEffect(() => {
    if (!isAuth) {
      router.push("/login");
    }
  }, []);

  // TODO: We will render the <App />
  if (isAuth) {
    return (
      <>
        <h1>You are logged in as {username}</h1>
      </>
    );
  }

  return null;
}

export default Home;
