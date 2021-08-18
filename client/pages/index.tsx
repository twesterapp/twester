import { useEffect } from "react";
import { useRouter } from "next/router";

const isServer = () => typeof window === "undefined";

function Home() {
  const router = useRouter();
  const isAuth = !isServer() && !!window.localStorage.getItem("access-token");

  useEffect(() => {
    if (!isAuth) {
      router.push("/login");
    }
  }, []);

  // TODO: Instead of the <h1> tag we will render the <App />
  return isAuth ? <h1>You are logged in !</h1> : null;
}

export default Home;
