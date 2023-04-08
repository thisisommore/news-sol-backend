import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { assert } from "chai";
import { News } from "../target/types/news";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const DISC = 8;
const MONTH_LEN = 1
const VIEWS_LEN = 8
const TITLE_LEN = 32;
const DESCRIPTION_LEN = 64;
const PLACE_LEN = 32;
const IMAGE_LEN = 32;
const CATEGORY_LEN = 32;
const VIDEO_LINK_LEN = 64;
const KEYWORDS_LEN = 8;

function stringToBuffer(str, len) {
  let buf = Buffer.alloc(len);
  buf.write(str);
  return Array.from(buf.slice(0, len));
}

function arrayToString(stren) {
  return Buffer.from(stren).toString().replace(/\x00+$/, '');
}

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
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const video_link = "Test News Video Link";
    const keywords = ["Test", "News", "Keywords", "WER", "erew"].map(keyword => stringToBuffer(keyword, KEYWORDS_LEN));

    const news_account = anchor.web3.Keypair.generate()
    // Act
    const tx = await program.methods.createNews(
      stringToBuffer(title, TITLE_LEN),
      stringToBuffer(description, DESCRIPTION_LEN),
      stringToBuffer(place, PLACE_LEN),
      stringToBuffer(image, IMAGE_LEN),
      stringToBuffer(category, CATEGORY_LEN),
      month,
      year,
      stringToBuffer(video_link, VIDEO_LINK_LEN),
      keywords,
    ).accounts({
      creator: creator.publicKey,
      news: news_account.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([news_account]).rpc();

    const fetched_news_account = await program.account.news.fetch(news_account.publicKey)

    assert.equal(fetched_news_account.creator.toString(), creator.publicKey.toString());
    assert.equal(arrayToString(fetched_news_account.title), title);
    assert.equal(arrayToString(fetched_news_account.description), description);
    assert.equal(arrayToString(fetched_news_account.place), place);
    assert.equal(arrayToString(fetched_news_account.image), image);
    assert.equal(arrayToString(fetched_news_account.category), category);
    assert.equal(fetched_news_account.month, month);
    assert.equal(arrayToString(fetched_news_account.videoLink), video_link);
    assert.deepEqual(fetched_news_account.keywords, keywords);
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
    const keywords = ["Test", "News", "Keywords", "", ""].map(keyword => stringToBuffer(keyword, KEYWORDS_LEN));
    const views = 10;
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const news_account = anchor.web3.Keypair.generate()
    // Act
    const createTx = await program.methods.createNews(
      stringToBuffer(title, TITLE_LEN),
      stringToBuffer(description, DESCRIPTION_LEN),
      stringToBuffer(place, PLACE_LEN),
      stringToBuffer(image, IMAGE_LEN),
      stringToBuffer(category, CATEGORY_LEN),
      month,
      year,
      stringToBuffer(video_link, VIDEO_LINK_LEN),
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

  })

  it("it fetched by title", async () => {
    // Arrange
    const creator = provider.wallet;
    const title = "I know how to study but wowo";
    const description = "Test News Description";
    const place = "Test News Place";
    const image = "Test News Image URL";
    const category = "Test News Category";
    const video_link = "Test News Video Link";
    const keywords = ["Test", "News", "Keywords", "", ""].map(keyword => stringToBuffer(keyword, KEYWORDS_LEN));;
    const month = new Date().getMonth();

    const year = new Date().getFullYear();
    const news_account = anchor.web3.Keypair.generate()
    // Act
    const tx = await program.methods.createNews(
      stringToBuffer(title, TITLE_LEN),
      stringToBuffer(description, DESCRIPTION_LEN),
      stringToBuffer(place, PLACE_LEN),
      stringToBuffer(image, IMAGE_LEN),
      stringToBuffer(category, CATEGORY_LEN),
      month,
      year,
      stringToBuffer(video_link, VIDEO_LINK_LEN),
      keywords,
    ).accounts({
      creator: creator.publicKey,
      news: news_account.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    }).signers([news_account]).rpc();


    // const max = await provider.connection.getProgramAccounts(program.programId)
    // const start_off_set = DISC + TITLE_LEN + DESCRIPTION_LEN + PLACE_LEN + IMAGE_LEN + CATEGORY_LEN + VIEWS_LEN
    // const maxes = max.map(e => e.account.data.slice(start_off_set, start_off_set + 1).toString("hex"))

    const fetched_news_accounts = await program.account.news.all([
      {
        memcmp: {
          offset: 8,
          bytes: bs58.encode(Buffer.from(title))
        },
      },
      {
        memcmp: {
          offset: 8 + TITLE_LEN,
          bytes: bs58.encode(Buffer.from(description))
        },
      },
      {
        memcmp: {
          offset: DISC + TITLE_LEN + DESCRIPTION_LEN + PLACE_LEN + IMAGE_LEN + CATEGORY_LEN + VIEWS_LEN,
          bytes: bs58.encode(Buffer.from([month]))
        },
      },
    ])

    const fetched_news_account = fetched_news_accounts[0].account

    assert.equal(fetched_news_account.creator.toString(), creator.publicKey.toString());
    assert.equal(arrayToString(fetched_news_account.title), title);
    assert.equal(arrayToString(fetched_news_account.description), description);
    assert.equal(arrayToString(fetched_news_account.place), place);
    assert.equal(arrayToString(fetched_news_account.image), image);
    assert.equal(arrayToString(fetched_news_account.category), category);
    assert.equal(fetched_news_account.month, month);
    assert.equal(arrayToString(fetched_news_account.videoLink), video_link);
    assert.deepEqual(fetched_news_account.keywords, keywords);

  })
})
