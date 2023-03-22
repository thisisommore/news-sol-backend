import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { assert } from "chai";
import { News } from "../target/types/news";

describe("news-app", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.News as Program<News>;

  it("creates a news article", async () => {
    // Arrange
    const creator = provider.wallet;
    const title = "Test News Title";
    const description = "Test News Description";
    const place = "Test News Place";
    const image = "Test News Image URL";
    const category = "Test News Category";
    const date = new BN(new Date().getTime());
    const video_link = "Test News Video Link";
    const keywords = ["Test", "News", "Keywords"];

    const news_account = anchor.web3.Keypair.generate()
    // Act
    const tx = await program.methods.createNews(
      title,
      description,
      place,
      image,
      category,
      date,
      video_link,
      keywords,
    ).accounts({
      creator: creator.publicKey,
      news: news_account.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([news_account]).rpc();

    const fetched_news_account = await program.account.news.fetch(news_account.publicKey)

    assert.ok(fetched_news_account.creator.equals(creator.publicKey));
    assert.ok(fetched_news_account.title === title);
    assert.ok(fetched_news_account.description === description);
    assert.ok(fetched_news_account.place === place);
    assert.ok(fetched_news_account.image === image);
    assert.ok(fetched_news_account.category === category);
    assert.ok(fetched_news_account.date.eq(date));
    assert.ok(fetched_news_account.videoLink === video_link);
    assert.ok(fetched_news_account.keywords[0] === keywords[0]);
    assert.ok(fetched_news_account.keywords[1] === keywords[1]);
    assert.ok(fetched_news_account.keywords[2] === keywords[2]);
  });

  it("updates the views of a news article", async () => {
    // Arrange
    const creator = provider.wallet;
    const viewer = anchor.web3.Keypair.generate();
    const title = "Test News Title";
    const description = "Test News Description";
    const place = "Test News Place";
    const image = "Test News Image URL";
    const category = "Test News Category";
    const date = new Date().getTime();
    const video_link = "Test News Video Link";
    const keywords = ["Test", "News", "Keywords"];
    const views = 10;

    const news_account = anchor.web3.Keypair.generate()
    // Act
    const createTx = await program.methods.createNews(
      title,
      description,
      place,
      image,
      category,
      new BN(date),
      video_link,
      keywords,
    ).accounts({
      creator: creator.publicKey,
      news: news_account.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([news_account]).rpc();

    const updateTx = await program.methods.updateViews(new BN(views)).accounts({
      creator: creator.publicKey,
      news: news_account.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).transaction();

    let blockhash = await provider.connection.getLatestBlockhash('finalized');
    updateTx.recentBlockhash = blockhash.blockhash;
    updateTx.feePayer = creator.publicKey
    const signed_tx = await creator.signTransaction(updateTx)
    await provider.sendAndConfirm(signed_tx)

    const fetched_news_account_after_update = await program.account.news.fetch(news_account.publicKey)

    assert.ok(fetched_news_account_after_update.views.eq(new BN(views)));

  }
  )
})