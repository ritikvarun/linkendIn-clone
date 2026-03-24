import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";

export default function Home() {
  const router = useRouter();
  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.maincontainer}>
          <div className={styles.maincontainer_left}>
            <p>Connect with Friends without Exaggeration</p>
            <p>A True social media platform, with stories no blufs !</p>
            <div
              onClick={() => {
                router.push("/login");
              }}
              className={styles.buttonJoin}
            >
              <p>Join Now</p>
            </div>
          </div>
          <div className={styles.maincontainer_right}>
            <Image
              src="/images/connection.png"
              alt="Picture of the author"
              width={500}
              height={500}
            />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
