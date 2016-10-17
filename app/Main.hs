{-# LANGUAGE OverloadedStrings, LambdaCase, TemplateHaskell, QuasiQuotes, TypeFamilies, MultiParamTypeClasses, GADTs, EmptyDataDecls, GeneralizedNewtypeDeriving #-}
module Main where

import Control.Monad.IO.Class
import Control.Monad.Logger
import Control.Monad.Trans.Maybe
import Control.Monad.Trans.Resource
import Data.ByteString (ByteString)
import Data.Text (Text)
import Database.Persist
import Database.Persist.Sqlite
import Database.Persist.TH
import Network.HTTP.Types
import Network.Wai
import Network.Wai.Application.Static
import qualified Data.Aeson as JSON
import qualified Data.ByteString.Lazy as BL
import qualified Network.Wai.Handler.Warp as Warp
import Control.Monad.Trans.Class

share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
Entry
    tagId TagId
    classId ClassId
    payload ByteString
    UniqueEntry tagId classId
Tag
    name Text
    UniqueTag name
Class
    name Text
    payload ByteString
    UniqueClass name
|]

fromMaybeT :: Functor f => a -> MaybeT f a -> f a
fromMaybeT x m = fmap (maybe x id) $ runMaybeT m

main :: IO ()
main = do
  pool <- runStderrLoggingT $ createSqlitePool "dev.sqlite3" 10
  let runDb :: SqlPersistT (LoggingT IO) a -> IO a
      runDb q = runStderrLoggingT $ runSqlPool q pool
  runDb $ runMigration migrateAll
  liftIO $ Warp.run 3000 $ \req sendResp -> case pathInfo req of
    ["tags"] -> do
      xs <- runDb $ selectList [] []
      sendResp $ responseLBS status200 [(hContentType, "application/json")]
        $ JSON.encode $ map (tagName . entityVal) xs

    ["classes"] -> do
      xs <- runDb $ selectList [] []
      sendResp $ responseLBS status200 [(hContentType, "application/json")]
        $ JSON.encode $ map (className . entityVal) xs

    ["tag", tag] -> case requestMethod req of
      "GET" -> runDb (getBy (UniqueTag tag)) >>= \case
        Just c -> sendResp $ responseLBS status200 [] ""
        Nothing -> sendResp $ responseLBS status404 [] "Not found"
      "POST" -> do
        body <- strictRequestBody req
        _ <- runDb $ upsert (Tag tag) []
        sendResp $ responseLBS status200 [] "Done"
      _ -> sendResp $ responseLBS status400 [] "Bad Request"

    ["class", cls] -> case requestMethod req of
      "GET" -> runDb (getBy (UniqueClass cls)) >>= \case
        Just c -> sendResp $ responseLBS status200 [] $ BL.fromStrict $ classPayload $ entityVal c
        Nothing -> sendResp $ responseLBS status404 [] "Not found"
      "POST" -> do
        body <- strictRequestBody req
        _ <- runDb $ upsert (Class cls (BL.toStrict body)) []
        sendResp $ responseLBS status200 [] "Done"
      _ -> sendResp $ responseLBS status400 [] "Bad Request"

    ["payload", tag, cls] -> case requestMethod req of
      "GET" -> (sendResp=<<) $ fromMaybeT (responseLBS status404 [] "Entry doesn't exist") $ do
        t <- MaybeT $ runDb $ getBy (UniqueTag tag)
        c <- MaybeT $ runDb $ getBy (UniqueClass cls)
        x <- MaybeT $ runDb $ getBy $ UniqueEntry (entityKey t) (entityKey c)
        return $ responseLBS status200 [] $ BL.fromStrict $ entryPayload $ entityVal x
      "POST" -> (sendResp=<<) $ fromMaybeT (responseLBS status404 [] "Entry doesn't exist") $ do
        t <- MaybeT $ runDb $ getBy (UniqueTag tag)
        c <- MaybeT $ runDb $ getBy (UniqueClass cls)
        body <- lift $ strictRequestBody req
        _ <- lift $ runDb $ upsert (Entry (entityKey t) (entityKey c) (BL.toStrict body)) []
        return $ responseLBS status200 [] "Done"
      _ -> sendResp $ responseLBS status400 [] "Bad Request"

    _ -> staticApp (defaultWebAppSettings "web") req sendResp
