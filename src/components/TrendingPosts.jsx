import { useEffect, useState } from "react";
import { getTrendingPosts } from "../../services/postService";

export default function TrendingPosts() {

    const [posts, setPosts] = useState([]);

    useEffect(() => {

        loadTrendingPosts();

    }, []);

    const loadTrendingPosts = async () => {

        try {

            const data = await getTrendingPosts();

            setPosts(data);

        } catch (error) {

            console.error(error);

        }

    };

    return (

        <div className="trending-posts">

            <h3>Trending Posts</h3>

            {
                posts.map(post => (

                    <div
                        key={post.id}
                        className="trending-post"
                    >

                        <strong>
                            {post.author.name}
                        </strong>

                        <p>
                            {post.content}
                        </p>

                        <small>

                            👍 {post.likeCount}

                            {" • "}

                            💬 {post.commentCount}

                        </small>

                    </div>

                ))
            }

        </div>

    );

}